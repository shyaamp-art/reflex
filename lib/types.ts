// Frozen Spec Section 9: Data Contracts (TypeScript)

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'UNASSIGNED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
export type RequiredLocation = 'REMOTE' | 'ONSITE' | 'HYBRID';
export type Proficiency = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
export type RequirementType = 'MUST_HAVE' | 'NICE_TO_HAVE';
export type AllocatedBy = 'AI' | 'MANUAL';
export type AllocationStatus = 'ACTIVE' | 'RELEASED';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';
export type Seniority = 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'PRINCIPAL';
export type EventType =
  | 'PERSON_UNAVAILABLE'
  | 'NEW_TASK'
  | 'PRIORITY_CHANGE'
  | 'SLA_RISK'
  | 'SKILL_GAP';
export type LogAction =
  | 'ALLOCATED'
  | 'REALLOCATED'
  | 'RELEASED'
  | 'PRIORITY_ESCALATED';

export type UserRole = 'MANAGER' | 'EMPLOYEE';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role_title?: string;
  seniority?: Seniority;
  team: string;
  location: string;
  timezone: string;
  status: EmployeeStatus;
  weekly_capacity_hours: number;
  current_workload_percent: number;
  performance_score: number;
  created_at: string;
  updated_at: string;
}

export interface EmployeeSkill {
  id: string;
  employee_id: string;
  skill_name: string;
  proficiency: Proficiency;
}

export interface EmployeeAvailability {
  id: string;
  employee_id: string;
  start_date: string; // ISO date YYYY-MM-DD
  end_date: string;   // ISO date YYYY-MM-DD
  reason: string;
  is_available: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  sla_deadline: string; // ISO timestamp
  estimated_effort: number;
  actual_effort?: number;
  tags: string[];
  status: TaskStatus;
  required_location: RequiredLocation;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskSkillRequirement {
  id: string;
  task_id: string;
  skill_name: string;
  proficiency: Proficiency;
  people_required: number;
  requirement_type: RequirementType;
}

export interface Allocation {
  id: string;
  task_id: string;
  employee_id: string;
  role_note?: string;
  score?: number;
  allocated_by: AllocatedBy;
  allocated_at: string;
  status: AllocationStatus;
}

export interface AppEvent {
  id: string;
  type: EventType;
  related_employee?: string;
  related_task?: string;
  missing_skill?: string;
  timestamp: string;
}

export interface AllocationLog {
  id: string;
  task_id?: string;
  action: LogAction;
  old_employee_id?: string;
  new_employee_id?: string;
  reason: string;
  triggered_by: AllocatedBy;
  before_state?: Record<string, unknown>;
  after_state?: Record<string, unknown>;
  event_id?: string;
  created_at: string;
}

export interface SkillGapEvent {
  skill_name: string;
  times_failed: number;
  related_events: string[];
  recommendation_strength?: number;
  suggested_hiring_priority?: number;
  last_occurred?: string;
  generated_at: string;
}

export interface Skill {
  name: string;
  created_at: string;
}

// AI Suggestion Contract (Spec 5.3 & SuggestionCard)
export interface ScoreBreakdown {
  skillMatch: number;
  workload: number;
  slaSafety: number;
  performance: number;
  location: number;
}

export interface AiSuggestion {
  employee: Employee;
  score: number; // 0 - 100
  reason: string;
  breakdown: ScoreBreakdown;
}
