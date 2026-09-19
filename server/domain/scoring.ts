import {
  Employee,
  Task,
  TaskSkillRequirement,
  ScoreBreakdown,
  CandidateScore,
  Proficiency,
  WorkMode
} from '../../src/types/index.js';

export const PROFICIENCY_LEVELS: Record<Proficiency, number> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  EXPERT: 4,
};

export interface ScoringContext {
  task: Pick<Task, 'id' | 'title' | 'estimated_effort' | 'sla_deadline' | 'required_location' | 'priority'>;
  requirements: TaskSkillRequirement[];
  employee: Employee;
  now?: Date;
  activeTasksForEmployee?: Pick<Task, 'id' | 'sla_deadline' | 'priority'>[];
  slaLookaheadHours?: number;
}

export function calculateCandidateScore(context: ScoringContext): CandidateScore {
  const { task, requirements, employee, now = new Date(), activeTasksForEmployee = [], slaLookaheadHours = 4 } = context;
  const rejectionReasons: string[] = [];

  // ACTIVE and AVAILABLE both represent employees who can receive work. The
  // latter is used by the live database for current availability state.
  if (employee.status !== 'ACTIVE' && employee.status !== 'AVAILABLE') {
    rejectionReasons.push('Employee status is inactive');
  }

  // Hard Rule 2: Work Mode Compatibility
  let locationScore = 0;
  const reqMode: WorkMode = task.required_location || 'REMOTE';
  const empMode: WorkMode = employee.work_mode || 'REMOTE';

  if (reqMode === 'REMOTE') {
    locationScore = 100;
  } else if (reqMode === 'HYBRID') {
    if (empMode === 'HYBRID' || empMode === 'ONSITE') {
      locationScore = 100;
    } else {
      locationScore = 0;
      rejectionReasons.push('Incompatible work mode: Task requires HYBRID/ONSITE, employee is REMOTE');
    }
  } else if (reqMode === 'ONSITE') {
    if (empMode === 'ONSITE') {
      locationScore = 100;
    } else if (empMode === 'HYBRID') {
      locationScore = 50;
    } else {
      locationScore = 0;
      rejectionReasons.push('Incompatible work mode: Task requires ONSITE, employee is REMOTE');
    }
  }

  // Hard Rule 3: Projected Workload cannot exceed 100%
  const capacity = employee.weekly_capacity_hours > 0 ? employee.weekly_capacity_hours : 40;
  const effort = Number.isFinite(task.estimated_effort) && task.estimated_effort >= 0 ? task.estimated_effort : 0;
  const additionalWorkloadPercent = (effort / capacity) * 100;
  const projectedWorkload = (employee.current_workload_percent || 0) + additionalWorkloadPercent;

  if (projectedWorkload > 100) {
    rejectionReasons.push(
      `Projected workload exceeds hard limit: ${projectedWorkload.toFixed(1)}% > 100%`
    );
  }
  const workloadScore = Math.max(0, 100 - projectedWorkload);

  // Hard Rule 4: Availability & Horizons
  // Check if today falls in an unavailable window
  const todayStr = now.toISOString().split('T')[0];
  const horizonDays = Math.max(0, Math.ceil(effort / 8));
  const horizonDate = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);
  const horizonStr = horizonDate.toISOString().split('T')[0];

  let availabilityScore = 100;
  let currentlyUnavailable = false;
  let futureUnavailableInHorizon = false;

  if (employee.availability && employee.availability.length > 0) {
    for (const win of employee.availability) {
      if (!win.is_available) {
        // Overlaps today?
        if (todayStr >= win.start_date && todayStr <= win.end_date) {
          currentlyUnavailable = true;
          break;
        }
        // Intersects completion horizon?
        if (
          (win.start_date <= horizonStr && win.end_date >= todayStr)
        ) {
          futureUnavailableInHorizon = true;
        }
      }
    }
  }

  if (currentlyUnavailable) {
    availabilityScore = 0;
    rejectionReasons.push('Employee is currently on scheduled leave / unavailable today');
  } else if (futureUnavailableInHorizon) {
    availabilityScore = 50;
  } else {
    availabilityScore = 100;
  }

  // Hard Rule 5: Skill Match
  // Check MUST_HAVE skills
  let weightedSkillSum = 0;
  let totalSkillWeights = 0;

  const empSkillsMap = new Map<string, number>();
  for (const s of employee.skills || []) {
    const key = s.skill_name.trim().toLowerCase();
    // Duplicate skill rows keep the highest proficiency, not the last row.
    empSkillsMap.set(key, Math.max(empSkillsMap.get(key) || 0, PROFICIENCY_LEVELS[s.proficiency] || 1));
  }

  // Duplicate task requirements are merged (highest proficiency, MUST_HAVE
  // wins) so they are not double-weighted in the skill score.
  const dedupedReqs = new Map<string, { name: string; level: number; isMustHave: boolean }>();
  for (const req of requirements) {
    const key = req.skill_name.trim().toLowerCase();
    const level = PROFICIENCY_LEVELS[req.proficiency] || 1;
    const prev = dedupedReqs.get(key);
    dedupedReqs.set(key, {
      name: req.skill_name,
      level: Math.max(prev?.level || 0, level),
      isMustHave: (prev?.isMustHave || false) || req.requirement_type === 'MUST_HAVE',
    });
  }

  for (const req of dedupedReqs.values()) {
    const reqProfVal = req.level;
    const isMustHave = req.isMustHave;
    const weight = isMustHave ? 1.0 : 0.5;
    totalSkillWeights += weight;

    const actualProfVal = empSkillsMap.get(req.name.trim().toLowerCase()) || 0;

    if (actualProfVal < reqProfVal) {
      if (isMustHave) {
        rejectionReasons.push(
          `Missing required MUST_HAVE skill: ${req.name} (${Object.keys(PROFICIENCY_LEVELS).find(k => PROFICIENCY_LEVELS[k as Proficiency] === reqProfVal) || reqProfVal} required, found ${actualProfVal === 0 ? 'None' : Object.keys(PROFICIENCY_LEVELS).find(k => PROFICIENCY_LEVELS[k as Proficiency] === actualProfVal)})`
        );
      }
      const matchRatio = reqProfVal > 0 ? actualProfVal / reqProfVal : 0;
      weightedSkillSum += Math.min(matchRatio, 1) * 100 * weight;
    } else {
      weightedSkillSum += 100 * weight;
    }
  }

  const skillMatchScore = totalSkillWeights > 0 ? weightedSkillSum / totalSkillWeights : 100;

  // Factor 4: Performance Score (1-5 scaled to 0-100)
  const performanceScore = Math.min(100, Math.max(0, ((employee.performance_score || 3.5) / 5) * 100));

  // Factor 5: SLA Safety
  // Start at 100
  // Subtract 25 for each active task assigned to employee with deadline within the lookahead
  // Subtract 30 if new task is due within the lookahead and projected workload > 90%
  let slaSafetyScore = 100;
  const lookaheadMs = slaLookaheadHours * 60 * 60 * 1000;
  const nowMs = now.getTime();

  for (const actTask of activeTasksForEmployee) {
    const deadlineMs = new Date(actTask.sla_deadline).getTime();
    if (deadlineMs - nowMs > 0 && deadlineMs - nowMs <= lookaheadMs) {
      slaSafetyScore -= 25;
    }
  }

  const newTaskDeadlineMs = new Date(task.sla_deadline).getTime();
  if (newTaskDeadlineMs - nowMs > 0 && newTaskDeadlineMs - nowMs <= lookaheadMs && projectedWorkload > 90) {
    slaSafetyScore -= 30;
  }
  slaSafetyScore = Math.max(0, Math.min(100, slaSafetyScore));

  const eligible = rejectionReasons.length === 0;

  // Composite Formula:
  // 0.35 * skillMatch + 0.15 * availability + 0.20 * workload + 0.10 * performance + 0.10 * slaSafety + 0.10 * location
  const rawScore =
    0.35 * skillMatchScore +
    0.15 * availabilityScore +
    0.20 * workloadScore +
    0.10 * performanceScore +
    0.10 * slaSafetyScore +
    0.10 * locationScore;

  const score = eligible ? Math.round(rawScore * 100) / 100 : 0;

  const breakdown: ScoreBreakdown = {
    skillMatch: Math.round(skillMatchScore * 100) / 100,
    availability: Math.round(availabilityScore * 100) / 100,
    workload: Math.round(workloadScore * 100) / 100,
    performance: Math.round(performanceScore * 100) / 100,
    slaSafety: Math.round(slaSafetyScore * 100) / 100,
    location: Math.round(locationScore * 100) / 100,
  };

  // Concise operational justification
  let reason = '';
  if (eligible) {
    reason = `Strong fit (${score.toFixed(1)}/100). Skill coverage ${breakdown.skillMatch}%, workload safe at ${projectedWorkload.toFixed(0)}%, SLA buffer intact.`;
  } else {
    reason = `Ineligible: ${rejectionReasons[0] || 'Did not meet operational criteria'}.`;
  }

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    roleTitle: employee.role_title,
    seniority: employee.seniority,
    team: employee.team,
    workMode: employee.work_mode,
    currentWorkload: employee.current_workload_percent,
    projectedWorkload: Math.round(projectedWorkload * 10) / 10,
    eligible,
    score,
    breakdown,
    rejectionReasons,
    reason,
  };
}
