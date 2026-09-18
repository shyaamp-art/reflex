import {
  Task,
  Employee,
  AllocationProposal,
  AppEvent,
  AllocationLog,
  SkillGapEvent,
  AgentSettings,
  UserSession,
  AllocationSuggestionResult,
} from '../types/index.js';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errData: any;
    try {
      errData = await res.json();
    } catch {
      errData = { message: res.statusText };
    }
    const error = new Error(errData?.error?.message || errData?.message || `HTTP ${res.status}`);
    (error as any).status = res.status;
    (error as any).data = errData;
    throw error;
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const api = {
  // Current user & Demo user switching
  getMe: () => request<{ user: UserSession }>('/api/me'),
  switchUser: (userId: string) =>
    request<{ user: UserSession }>('/api/me/switch-user', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  getUsers: () => request<{ users: UserSession[] }>('/api/users'),

  // Tasks
  getTasks: (params?: { search?: string; status?: string; priority?: string; sla?: string; assigned_to?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ items: Task[]; total: number }>(`/api/tasks${query ? `?${query}` : ''}`);
  },
  getTask: (id: string) =>
    request<{ task: Task; requirements: any[]; allocations: any[]; audit_logs: AllocationLog[]; events: AppEvent[] }>(
      `/api/tasks/${id}`
    ),
  createTask: (data: any) =>
    request<{ task: Task; allocations: any[]; audit_log_id?: string }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTask: (id: string, updates: Partial<Task>) =>
    request<{ task: Task }>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
  updateTaskStatus: (id: string, status: string, actor_name?: string) =>
    request<{ task: Task }>(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, actor_name }),
    }),
  deleteTask: (id: string) =>
    request<void>(`/api/tasks/${id}`, {
      method: 'DELETE',
    }),
  releaseAllocation: (taskId: string, allocationId: string, reason?: string) =>
    request<{ released_allocation: any; new_proposal?: AllocationProposal }>(
      `/api/tasks/${taskId}/allocations/release`,
      {
        method: 'POST',
        body: JSON.stringify({ allocation_id: allocationId, reason }),
      }
    ),
  getAllocationSuggestions: (data: any) =>
    request<AllocationSuggestionResult>('/api/tasks/allocation-suggestions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Reallocations
  getReallocations: (status?: string) =>
    request<{ items: AllocationProposal[]; total: number }>(
      `/api/reallocations${status ? `?status=${status}` : ''}`
    ),
  getReallocation: (id: string) =>
    request<{ proposal: AllocationProposal }>(`/api/reallocations/${id}`),
  approveReallocation: (id: string, decision_note?: string) =>
    request<{ proposal: AllocationProposal; allocations: any[]; audit_log_ids: string[] }>(
      `/api/reallocations/${id}/approve`,
      {
        method: 'POST',
        body: JSON.stringify({ decision_note }),
      }
    ),
  overrideReallocation: (id: string, employee_ids: string[], reason?: string) =>
    request<{ proposal: AllocationProposal; allocations: any[]; audit_log_ids: string[] }>(
      `/api/reallocations/${id}/override`,
      {
        method: 'POST',
        body: JSON.stringify({ employee_ids, reason }),
      }
    ),

  // Employees
  getEmployees: (params?: { search?: string; team?: string; status?: string; workload?: string; skill?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ items: Employee[]; total: number }>(`/api/employees${query ? `?${query}` : ''}`);
  },
  getEmployee: (id: string) =>
    request<{ employee: Employee; skills: any[]; availability: any[]; active_allocations: any[] }>(
      `/api/employees/${id}`
    ),
  updateEmployee: (id: string, data: Partial<Employee>) =>
    request<{ employee: Employee }>(`/api/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  updateEmployeeSkills: (id: string, skills: any[]) =>
    request<{ skills: any[] }>(`/api/employees/${id}/skills`, {
      method: 'PUT',
      body: JSON.stringify({ skills }),
    }),

  // Employee Portal
  getEmployeeTasks: (employeeId?: string) =>
    request<{ employee: Employee; items: { allocation: any; task: Task }[]; total: number }>(
      `/api/employee/me/tasks${employeeId ? `?employee_id=${employeeId}` : ''}`
    ),
  updateEmployeeTaskStatus: (taskId: string, status: string, employee_name?: string) =>
    request<{ task: Task }>(`/api/employee/me/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, employee_name }),
    }),
  getEmployeeAvailability: (employeeId?: string) =>
    request<{ items: any[] }>(
      `/api/employee/me/availability${employeeId ? `?employee_id=${employeeId}` : ''}`
    ),
  setEmployeeAvailability: (data: {
    employee_id: string;
    start_date: string;
    end_date: string;
    is_available: boolean;
    reason: string;
  }) =>
    request<{ availability: any; affected_tasks_count: number; created_proposals_count: number }>(
      '/api/employee/me/availability',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  deleteEmployeeAvailability: (id: string, employeeId?: string) =>
    request<void>(`/api/employee/me/availability/${id}${employeeId ? `?employee_id=${employeeId}` : ''}`, {
      method: 'DELETE',
    }),

  // Events, Audit, Skill Gaps, Settings, Cron
  getEvents: (params?: { type?: string; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ items: AppEvent[]; total: number }>(`/api/events${query ? `?${query}` : ''}`);
  },
  getAuditLogs: (params?: { task_id?: string; employee_id?: string; action?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ items: AllocationLog[]; total: number }>(`/api/audit${query ? `?${query}` : ''}`);
  },
  getSkillGaps: () => request<{ items: SkillGapEvent[]; total: number }>('/api/skill-gaps'),
  reviewSkillGap: (skill: string) =>
    request<{ item: SkillGapEvent }>(`/api/skill-gaps/${encodeURIComponent(skill)}/review`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  getAgentSettings: () => request<{ settings: AgentSettings }>('/api/settings/agent'),
  updateAgentSettings: (data: Partial<AgentSettings>) =>
    request<{ settings: AgentSettings }>('/api/settings/agent', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getSkills: () => request<{ skills: string[] }>('/api/settings/skills'),
  addSkill: (name: string) =>
    request<{ skill: string; skills: string[] }>('/api/settings/skills', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  runSlaCron: () =>
    request<{ success: boolean; processed: number; escalated_count: number; proposals_created: number }>(
      '/api/internal/cron/sla'
    ),
};
