export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'UNASSIGNED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
export type WorkMode = 'REMOTE' | 'HYBRID' | 'ONSITE';
export type Proficiency = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
export type Seniority = 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'AVAILABLE' | 'UNAVAILABLE';
export type Role = 'MANAGER' | 'EMPLOYEE';
export type AllocationStatus = 'ACTIVE' | 'RELEASED';
export type AllocatedBy = 'AI' | 'MANUAL';
export type AuditAction = 'ALLOCATED' | 'REALLOCATED' | 'RELEASED' | 'PRIORITY_ESCALATED' | 'SLA_RISK';
export type AuditTrigger = 'AI' | 'MANAGER';
export type EventType = 'PERSON_UNAVAILABLE' | 'NEW_TASK' | 'PRIORITY_CHANGE' | 'SLA_RISK';
export type ProposalType = 'INITIAL_ALLOCATION' | 'REALLOCATION' | 'PRIORITY_REALLOCATION';
export type ProposalStatus = 'PENDING' | 'PROPOSED' | 'APPROVED' | 'OVERRIDDEN' | 'REJECTED' | 'EXPIRED' | 'NO_FEASIBLE_MATCH';

export interface ScoreBreakdown {
  skillMatch: number;      // 35%
  availability: number;    // 15%
  workload: number;        // 20%
  performance: number;     // 10%
  slaSafety: number;       // 10%
  location: number;        // 10%
}

export interface CandidateScore {
  employeeId: string;
  employeeName: string;
  roleTitle: string;
  seniority: Seniority;
  team: string;
  workMode: WorkMode;
  currentWorkload: number;
  projectedWorkload: number;
  eligible: boolean;
  score: number;
  breakdown: ScoreBreakdown;
  rejectionReasons: string[];
  reason: string;
}

export interface EmployeeSkill {
  id: string;
  employee_id: string;
  skill_name: string;
  proficiency: Proficiency;
  verified: boolean;
}

export interface EmployeeAvailability {
  id: string;
  employee_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  is_available: boolean;
  reason: string;
  created_at: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  team: string;
  role_title: string;
  seniority: Seniority;
  status: EmployeeStatus;
  work_mode: WorkMode;
  weekly_capacity_hours: number;
  current_workload_percent: number;
  performance_score: number; // 1 to 5
  location: string;
  timezone: string;
  avatar_url?: string;
  skills: EmployeeSkill[];
  availability?: EmployeeAvailability[];
  activeAllocationsCount?: number;
}

export interface TaskSkillRequirement {
  id: string;
  task_id: string;
  skill_name: string;
  proficiency: Proficiency;
  people_required: number;
  requirement_type: 'MUST_HAVE' | 'NICE_TO_HAVE';
}

export interface Allocation {
  id: string;
  task_id: string;
  employee_id: string;
  status: AllocationStatus;
  allocated_by: AllocatedBy;
  allocated_at: string;
  released_at?: string;
  employee?: Employee;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  sla_deadline: string; // ISO UTC
  estimated_effort: number; // hours
  tags: string[];
  required_location: WorkMode;
  skill_requirements: TaskSkillRequirement[];
  allocations?: Allocation[];
  created_at: string;
  updated_at: string;
}

export interface AppEvent {
  id: string;
  type: EventType;
  payload: Record<string, any>;
  created_at: string;
}

export interface AllocationProposalItem {
  id: string;
  proposal_id: string;
  employee_id: string;
  rank: number;
  score: number;
  skill_match: number;
  availability: number;
  workload: number;
  performance: number;
  sla_safety: number;
  location: number;
  reason: string;
  role_note?: string;
  source_task_id?: string;
  displaces_allocation_id?: string;
  selected: boolean;
  employee?: Employee;
  source_task?: Task;
}

export interface AllocationProposal {
  id: string;
  task_id: string;
  event_id?: string;
  trigger_type?: EventType;
  proposal_type: ProposalType;
  status: ProposalStatus;
  summary: string;
  explanation: string;
  items: AllocationProposalItem[];
  candidates?: CandidateScore[];
  task?: Task;
  event?: AppEvent;
  current_allocations?: Allocation[];
  created_at: string;
  decided_at?: string;
  decided_by?: string;
  decision_note?: string;
}

export interface AllocationLog {
  id: string;
  task_id: string;
  employee_id: string;
  event_id?: string;
  action: AuditAction;
  triggered_by: AuditTrigger;
  actor_user_id?: string;
  actor_name?: string;
  before_state: Record<string, any>;
  after_state: Record<string, any>;
  reason: string;
  created_at: string;
  task_title?: string;
  employee_name?: string;
}

export interface SkillGapEvent {
  id: string;
  skill_name: string;
  times_failed: number;
  related_events: string[];
  last_occurred: string;
  recommendation_strength: number; // 0 to 1
  suggested_hiring_priority: 1 | 2 | 3;
  impact_level?: string;
  recommendation?: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface AgentSettings {
  sla_lookahead_hours: number;
  sla_scan_interval_minutes: number;
  workload_soft_limit: number;
  workload_hard_limit: number;
  updated_at: string;
}

export interface UserSession {
  authUserId: string;
  role: Role;
  employeeId: string | null;
  name: string;
  email: string;
  avatar_url?: string;
}

export interface AllocationSuggestionResult {
  suggestions: CandidateScore[];
  selected?: CandidateScore[];
  eligible_count: number;
  status?: string;
  total_headcount_required?: number;
  total_headcount_filled?: number;
  generated_at: string;
  uncovered_requirements?: {
    skill_name: string;
    required_count: number;
    covered_count: number;
    requirement_type?: 'MUST_HAVE' | 'NICE_TO_HAVE';
  }[];
  explanation?: {
    summary: string;
    risk_flags: string[];
    candidate_reasons: { employee_id: string; reason: string }[];
    source?: 'gemini' | 'deterministic';
    model_used?: string;
  };
}
