import {
  Employee,
  Task,
  TaskSkillRequirement,
  CandidateScore,
  Proficiency,
} from '../../src/types/index.js';
import { calculateCandidateScore, PROFICIENCY_LEVELS } from './scoring.js';
import { applyPythonScores, getPythonSelection, optimizeWithPython } from './optimizer-client.js';

export interface AllocationPlan {
  status: 'READY' | 'NO_FEASIBLE_MATCH';
  selected: CandidateScore[];
  rankedCandidates: CandidateScore[];
  uncoveredRequirements: {
    skill_name: string;
    required_count: number;
    covered_count: number;
  }[];
  totalHeadcountRequired: number;
  totalHeadcountFilled: number;
}

export function buildAllocationPlan(
  task: Task,
  workforce: Employee[],
  now = new Date(),
  activeTasksMap: Record<string, Pick<Task, 'id' | 'sla_deadline' | 'priority'>[]> = {},
  slaLookaheadHours = 4
): AllocationPlan {
  const rawRequirements = task.skill_requirements || [];
  // Merge duplicate requirements for the same skill so they are not
  // double-counted: highest proficiency wins, MUST_HAVE wins, headcount is max.
  const merged = new Map<string, TaskSkillRequirement>();
  for (const req of rawRequirements) {
    const key = req.skill_name.trim().toLowerCase();
    const prev = merged.get(key);
    if (!prev) {
      merged.set(key, { ...req });
    } else {
      const levelOf = (p: TaskSkillRequirement['proficiency']) => PROFICIENCY_LEVELS[p] || 1;
      merged.set(key, {
        ...prev,
        proficiency: levelOf(req.proficiency) > levelOf(prev.proficiency) ? req.proficiency : prev.proficiency,
        people_required: Math.max(prev.people_required || 1, req.people_required || 1),
        requirement_type: prev.requirement_type === 'MUST_HAVE' || req.requirement_type === 'MUST_HAVE' ? 'MUST_HAVE' : 'NICE_TO_HAVE',
      });
    }
  }
  const requirements = [...merged.values()];
  const totalHeadcountRequired = requirements.reduce(
    (acc, req) => Math.max(acc, req.people_required || 1),
    1
  );

  // 1. Calculate scores for all employees
  let candidateScores: CandidateScore[] = workforce.map((employee) => {
    return calculateCandidateScore({
      task,
      requirements,
      employee,
      now,
      activeTasksForEmployee: activeTasksMap[employee.id] || [],
      slaLookaheadHours,
    });
  });
  const pythonResult = optimizeWithPython(task, workforce, totalHeadcountRequired);
  if (pythonResult) {
    candidateScores = applyPythonScores(candidateScores, pythonResult);
  }

  // Rank all candidates: eligible first by score descending, then ineligible
  const rankedCandidates = [...candidateScores].sort((a, b) => {
    if (a.eligible && !b.eligible) return -1;
    if (!a.eligible && b.eligible) return 1;
    return b.score - a.score || a.employeeId.localeCompare(b.employeeId);
  });

  const eligibleCandidates = rankedCandidates.filter((c) => c.eligible);

  // Track requirement coverage
  // A requirement slot needs `people_required` people who satisfy the skill & level
  const requirementNeeds = requirements.map((req) => ({
    skill_name: req.skill_name.trim().toLowerCase(),
    proficiency: req.proficiency,
    minLevel: PROFICIENCY_LEVELS[req.proficiency] || 1,
    required_count: req.people_required || 1,
    covered_count: 0,
    requirement_type: req.requirement_type,
  }));

  const selectedCandidates: CandidateScore[] = [];
  const selectedEmpIds = new Set<string>();

  const pythonSelection = pythonResult ? getPythonSelection(pythonResult) : null;
  if (pythonSelection) {
    for (const candidate of rankedCandidates) {
      if (pythonSelection.has(candidate.employeeId) && candidate.eligible) {
        selectedCandidates.push(candidate);
        selectedEmpIds.add(candidate.employeeId);
      }
    }

    // Validate coverage for the Hungarian result using the same hard skill
    // constraints used by the TypeScript fallback.
    for (const candidate of selectedCandidates) {
      const employee = workforce.find((item) => item.id === candidate.employeeId);
      const skills = new Map<string, number>();
      for (const skill of employee?.skills || []) {
        const key = skill.skill_name.trim().toLowerCase();
        skills.set(key, Math.max(skills.get(key) || 0, PROFICIENCY_LEVELS[skill.proficiency] || 1));
      }
      for (const requirement of requirementNeeds) {
        if (
          requirement.covered_count < requirement.required_count &&
          (skills.get(requirement.skill_name) || 0) >= requirement.minLevel
        ) {
          requirement.covered_count += 1;
        }
      }
    }
  }

  // Greedy coverage selection fills remaining headcount, including when the
  // optional Python optimizer missed MUST_HAVE coverage or is unavailable.
  while (
    selectedCandidates.length < totalHeadcountRequired &&
    selectedCandidates.length < eligibleCandidates.length
  ) {
    let bestCandidate: CandidateScore | null = null;
    let bestGain = -Infinity;

    for (const candidate of eligibleCandidates) {
      if (selectedEmpIds.has(candidate.employeeId)) continue;

      const employeeObj = workforce.find((e) => e.id === candidate.employeeId);
      if (!employeeObj) continue;

      const empSkillsMap = new Map<string, number>();
      for (const s of employeeObj.skills || []) {
        const key = s.skill_name.trim().toLowerCase();
        empSkillsMap.set(key, Math.max(empSkillsMap.get(key) || 0, PROFICIENCY_LEVELS[s.proficiency] || 1));
      }

      // Calculate how many uncovered slots this candidate satisfies
      let newCoverageSlots = 0;
      for (const req of requirementNeeds) {
        if (req.covered_count < req.required_count) {
          const empLevel = empSkillsMap.get(req.skill_name) || 0;
          if (empLevel >= req.minLevel) {
            newCoverageSlots += req.requirement_type === 'MUST_HAVE' ? 2 : 1;
          }
        }
      }

      // Marginal gain formula: new_requirement_coverage * 70 + candidate.score * 0.30
      const gain = newCoverageSlots * 70 + candidate.score * 0.3;

      if (
        gain > bestGain ||
        (gain === bestGain && bestCandidate !== null && candidate.employeeId.localeCompare(bestCandidate.employeeId) < 0)
      ) {
        bestGain = gain;
        bestCandidate = candidate;
      }
    }

    if (!bestCandidate) break;

    selectedCandidates.push(bestCandidate);
    selectedEmpIds.add(bestCandidate.employeeId);

    // Update covered counts
    const chosenEmp = workforce.find((e) => e.id === bestCandidate.employeeId);
    if (chosenEmp) {
      const chosenSkillsMap = new Map<string, number>();
      for (const s of chosenEmp.skills || []) {
        const key = s.skill_name.trim().toLowerCase();
        chosenSkillsMap.set(key, Math.max(chosenSkillsMap.get(key) || 0, PROFICIENCY_LEVELS[s.proficiency] || 1));
      }
      for (const req of requirementNeeds) {
        if (req.covered_count < req.required_count) {
          const lvl = chosenSkillsMap.get(req.skill_name) || 0;
          if (lvl >= req.minLevel) {
            req.covered_count += 1;
          }
        }
      }
    }
  }

  // Check if any MUST_HAVE requirement remains uncovered
  const uncoveredMustHaves = requirementNeeds.filter(
    (r) => r.requirement_type === 'MUST_HAVE' && r.covered_count < r.required_count
  );

  const status: 'READY' | 'NO_FEASIBLE_MATCH' =
    uncoveredMustHaves.length === 0 && selectedCandidates.length >= totalHeadcountRequired
      ? 'READY'
      : 'NO_FEASIBLE_MATCH';

  return {
    status,
    selected: selectedCandidates,
    rankedCandidates,
    uncoveredRequirements: requirementNeeds.map((r) => ({
      skill_name: r.skill_name,
      required_count: r.required_count,
      covered_count: r.covered_count,
    })),
    totalHeadcountRequired,
    totalHeadcountFilled: selectedCandidates.length,
  };
}
