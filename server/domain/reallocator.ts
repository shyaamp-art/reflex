import {
  Employee,
  Task,
  Allocation,
  AppEvent,
  AllocationProposal,
  AllocationProposalItem,
  ProposalType,
} from '../../src/types/index.js';
import { buildAllocationPlan } from './allocator.js';

export interface ReallocationContext {
  event: AppEvent;
  affectedTask: Task;
  workforce: Employee[];
  currentAllocations: Allocation[];
  allActiveTasks?: Task[];
}

export function generateReallocationProposal(context: ReallocationContext): {
  proposal: Omit<AllocationProposal, 'id' | 'created_at'>;
  uncoveredSkills: string[];
} {
  const { event, affectedTask, workforce, currentAllocations, allActiveTasks = [] } = context;

  let proposalType: ProposalType = 'REALLOCATION';
  if (event.type === 'PRIORITY_CHANGE') {
    proposalType = 'PRIORITY_REALLOCATION';
  } else if (event.type === 'NEW_TASK') {
    proposalType = 'INITIAL_ALLOCATION';
  }

  // Filter out unavailable employee for PERSON_UNAVAILABLE event
  let eligibleWorkforce = [...workforce];
  let unavailableEmpId: string | null = null;

  if (event.type === 'PERSON_UNAVAILABLE' && event.payload?.employee_id) {
    unavailableEmpId = event.payload.employee_id;
    eligibleWorkforce = workforce.filter((e) => e.id !== unavailableEmpId);
  }

  // Active tasks map for SLA safety
  const activeTasksMap: Record<string, Pick<Task, 'id' | 'sla_deadline' | 'priority'>[]> = {};
  for (const t of allActiveTasks) {
    for (const alloc of t.allocations || []) {
      if (alloc.status === 'ACTIVE') {
        if (!activeTasksMap[alloc.employee_id]) {
          activeTasksMap[alloc.employee_id] = [];
        }
        activeTasksMap[alloc.employee_id].push({
          id: t.id,
          sla_deadline: t.sla_deadline,
          priority: t.priority,
        });
      }
    }
  }

  // Run allocation plan
  const plan = buildAllocationPlan(affectedTask, eligibleWorkforce, new Date(), activeTasksMap);

  const proposalItems: AllocationProposalItem[] = plan.rankedCandidates.slice(0, 5).map((candidate, idx) => {
    const isSelected = plan.selected.some((s) => s.employeeId === candidate.employeeId);
    return {
      id: `prop-item-${Date.now()}-${idx}`,
      proposal_id: '',
      employee_id: candidate.employeeId,
      rank: idx + 1,
      score: candidate.score,
      skill_match: candidate.breakdown.skillMatch,
      availability: candidate.breakdown.availability,
      workload: candidate.breakdown.workload,
      performance: candidate.breakdown.performance,
      sla_safety: candidate.breakdown.slaSafety,
      location: candidate.breakdown.location,
      reason: candidate.reason,
      selected: isSelected,
      role_note: isSelected ? 'Recommended Replacement' : undefined,
    };
  });

  const uncoveredSkills: string[] = plan.uncoveredRequirements
    .filter((u) => u.covered_count < u.required_count)
    .map((u) => u.skill_name);

  let summary = '';
  let explanation = '';

  if (plan.status === 'READY') {
    const selectedNames = plan.selected.map((s) => s.employeeName).join(', ');
    summary = `Proposed reallocation for "${affectedTask.title}": Assign ${selectedNames} (SLA & skill coverage verified).`;
    explanation = `Due to ${event.type.replace('_', ' ').toLowerCase()}, replacement plan identified ${plan.selected.length} qualified candidate(s). Top recommendation: ${selectedNames} with average score ${plan.selected[0]?.score.toFixed(1)}/100 and safe projected workload.`;
  } else {
    summary = `Alert: No feasible match found for "${affectedTask.title}". Uncovered skills: ${uncoveredSkills.join(', ') || 'Headcount capacity limit'}.`;
    explanation = `The system analyzed all available personnel but could not safely satisfy MUST_HAVE requirements without violating workload limits (>100%) or SLA thresholds. Manual manager review or scope adjustment required.`;
  }

  return {
    proposal: {
      task_id: affectedTask.id,
      event_id: event.id,
      proposal_type: proposalType,
      status: plan.status === 'READY' ? 'PENDING' : 'NO_FEASIBLE_MATCH',
      summary,
      explanation,
      items: proposalItems,
    },
    uncoveredSkills,
  };
}
