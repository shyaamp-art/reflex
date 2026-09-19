import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { CandidateScore, Employee, Task } from '../../src/types/index.js';

const root = process.cwd();
const enabled = process.env.REFLEX_OPTIMIZER_ENABLED !== 'false';

interface PythonCandidate {
  employee_id: string;
  skill_similarity: number;
  score: number;
  eligible: boolean;
}

interface PythonResult {
  status: 'READY' | 'NO_FEASIBLE_MATCH';
  candidates: PythonCandidate[];
  selected_employee_ids: string[];
}

function invokePython(payload: Record<string, unknown>): PythonResult | null {
  if (!enabled) return null;
  const result = spawnSync(
    process.env.PYTHON || 'python',
    [path.join(root, 'optimizer', 'service.py'), '--once'],
    { cwd: root, input: JSON.stringify(payload), encoding: 'utf8', timeout: 30_000, windowsHide: true },
  );
  if (result.error || result.status !== 0 || !result.stdout?.trim()) return null;
  try {
    return JSON.parse(result.stdout) as PythonResult;
  } catch {
    return null;
  }
}

export function optimizeWithPython(
  task: Task,
  employees: Employee[],
  headcount: number,
): PythonResult | null {
  return invokePython({
    operation: 'optimize',
    task,
    headcount,
    employees: employees.map((employee) => ({
      ...employee,
      eligible: employee.status === 'ACTIVE' || employee.status === 'AVAILABLE',
      currently_unavailable: employee.status === 'UNAVAILABLE' || employee.status === 'INACTIVE',
      // Same location rule as scoring.ts: REMOTE accepts all; HYBRID task
      // accepts HYBRID/ONSITE; ONSITE task prefers ONSITE (100) over HYBRID (50).
      location_score: task.required_location === 'REMOTE'
        ? 100
        : task.required_location === 'HYBRID'
          ? (employee.work_mode === 'HYBRID' || employee.work_mode === 'ONSITE' ? 100 : 0)
          : (employee.work_mode === 'ONSITE' ? 100 : employee.work_mode === 'HYBRID' ? 50 : 0),
      sla_safety_score: 100,
    })),
  });
}

export function applyPythonScores(
  scores: CandidateScore[],
  result: PythonResult,
): CandidateScore[] {
  const byId = new Map(result.candidates.map((candidate) => [candidate.employee_id, candidate]));
  return scores.map((candidate) => {
    const python = byId.get(candidate.employeeId);
    if (!python) return candidate;
    const similarity = Math.max(0, Math.min(1, python.skill_similarity));
    // Same composite weights as scoring.ts:
    // 0.35 skill + 0.20 workload + 0.15 availability + 0.10 performance +
    // 0.10 slaSafety + 0.10 location.
    const weighted = (
      similarity * 0.35
      + (candidate.breakdown.workload / 100) * 0.20
      + (candidate.breakdown.availability / 100) * 0.15
      + (candidate.breakdown.performance / 100) * 0.10
      + (candidate.breakdown.slaSafety / 100) * 0.10
      + (candidate.breakdown.location / 100) * 0.10
    ) * 100;
    return {
      ...candidate,
      score: candidate.eligible && python.eligible ? Math.round(weighted * 100) / 100 : 0,
      breakdown: { ...candidate.breakdown, skillMatch: Math.round(similarity * 10000) / 100 },
    };
  });
}

export function getPythonSelection(result: PythonResult): Set<string> {
  return new Set(result.selected_employee_ids);
}

export function calculatePythonSkillGaps(
  activeEmployeeSkillCounts: Record<string, number>,
  skillGapFrequencies: Record<string, number>,
): Array<Record<string, number | string>> | null {
  const result = invokePython({
    operation: 'skill-gaps',
    active_employee_skill_counts: activeEmployeeSkillCounts,
    skill_gap_frequencies: skillGapFrequencies,
  }) as unknown as { items?: Array<Record<string, number | string>> } | null;
  return result?.items || null;
}
