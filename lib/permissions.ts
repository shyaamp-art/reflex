// lib/permissions.ts - Role-based permissions per Spec Section 10

import { UserRole } from './types';

export type PermissionAction =
  | 'tasks:view_all'
  | 'tasks:create'
  | 'tasks:allocate'
  | 'tasks:edit'
  | 'tasks:delete'
  | 'employees:view_all'
  | 'employees:edit'
  | 'reallocations:view'
  | 'reallocations:approve'
  | 'skill_gaps:view'
  | 'audit:view'
  | 'settings:edit'
  | 'employee:view_self'
  | 'employee:edit_availability'
  | 'employee:edit_skills'
  | 'employee:update_task_progress';

export function can(role: UserRole | undefined | null, action: PermissionAction): boolean {
  if (!role) return false;

  if (role === 'MANAGER') {
    switch (action) {
      case 'tasks:view_all':
      case 'tasks:create':
      case 'tasks:allocate':
      case 'tasks:edit':
      case 'tasks:delete':
      case 'employees:view_all':
      case 'employees:edit':
      case 'reallocations:view':
      case 'reallocations:approve':
      case 'skill_gaps:view':
      case 'audit:view':
      case 'settings:edit':
        return true;
      default:
        return false;
    }
  }

  if (role === 'EMPLOYEE') {
    switch (action) {
      case 'employee:view_self':
      case 'employee:edit_availability':
      case 'employee:edit_skills':
      case 'employee:update_task_progress':
        return true;
      default:
        return false;
    }
  }

  return false;
}
