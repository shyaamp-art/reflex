import {
  Employee,
  Task,
  TaskSkillRequirement,
  CandidateScore,
  Proficiency,
} from '../../src/types/index.js';
import { calculateCandidateScore, PROFICIENCY_LEVELS } from './scoring.js';

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
  activeTasksMap: Record<string, Pick<Task, 'id' | 'sla_deadline' | 'priority'>[]> = {}
): AllocationPlan {
  const requirements = task.skill_requirements || [];
  const totalHeadcountRequired = requirements.reduce(
    (acc, req) => Math.max(acc, req.people_required || 1),
    1
  );

  // 1. Calculate scores for all employees
  const candidateScores: CandidateScore[] = workforce.map((employee) => {
    return calculateCandidateScore({
      task,
      requirements,
      employee,
      now,
      activeTasksForEmployee: activeTasksMap[employee.id] || [],
    });
  });

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

  // Greedy coverage selection loop
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
        empSkillsMap.set(s.skill_name.trim().toLowerCase(), PROFICIENCY_LEVELS[s.proficiency] || 1);
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
        chosenSkillsMap.set(s.skill_name.trim().toLowerCase(), PROFICIENCY_LEVELS[s.proficiency] || 1);
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
