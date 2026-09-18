// lib/enums.ts - Re-exporting all frozen union types from lib/types.ts

export type {
  Priority,
  TaskStatus,
  RequiredLocation,
  Proficiency,
  RequirementType,
  AllocatedBy,
  AllocationStatus,
  EmployeeStatus,
  Seniority,
  EventType,
  LogAction,
  UserRole,
} from './types';

export const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
export const TASK_STATUSES = ['UNASSIGNED', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'] as const;
export const LOCATIONS = ['REMOTE', 'ONSITE', 'HYBRID'] as const;
export const PROFICIENCIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const;
export const REQUIREMENT_TYPES = ['MUST_HAVE', 'NICE_TO_HAVE'] as const;
export const SENIORITIES = ['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'PRINCIPAL'] as const;
