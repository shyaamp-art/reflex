import { createHash } from 'node:crypto';
import { supabase } from './supabase.js';
import type { ReflexStore } from './store.js';

const uuid = (value: string) => {
  if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(value)) return value;
  const h = createHash('sha256').update(value).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const table = async (name: string) => {
  if (!supabase.client) throw new Error('Supabase persistence is configured without SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  const result = await supabase.client.from(name).select('*');
  if (result.error) throw new Error(`Supabase ${name} read failed: ${result.error.message}`);
  return result.data || [];
};
const upsert = async (name: string, rows: any[]) => {
  if (!rows.length) return;
  const result = await supabase.client!.from(name).upsert(rows);
  if (result.error) throw new Error(`Supabase ${name} write failed: ${result.error.message}`);
};

export class SupabaseRepository {
  async hydrate(store: ReflexStore) {
    const [users, employees, employeeSkills, availability, tasks, requirements, allocations, events, audits, gaps, settings] =
      await Promise.all(['users', 'employees', 'employee_skills', 'employee_availability', 'tasks',
        'task_skill_requirements', 'allocations', 'events', 'audit_logs', 'skill_gaps', 'agent_settings'].map(table));

    if (employees.length) {
      store.employees = employees.map((row: any) => ({
        ...row, weekly_capacity_hours: Number(row.weekly_capacity_hours),
        current_workload_percent: Number(row.current_workload_percent),
        performance_score: Number(row.performance_score),
        skills: employeeSkills.filter((s: any) => s.employee_id === row.id),
        availability: availability.filter((a: any) => a.employee_id === row.id),
      }));
    }
    if (users.length) {
      (store as any).__userDbIds = new Map(users.map((u: any) => [u.auth_user_id, u.id]));
      store.users = users.map((u: any) => ({
        authUserId: u.auth_user_id, role: u.role, employeeId: u.employee_id, name: u.name, email: u.email, avatar_url: u.avatar_url,
      }));
    }
    if (tasks.length) store.tasks = tasks.map((t: any) => ({
      ...t, estimated_effort: Number(t.estimated_effort),
      tags: Array.isArray(t.tags) ? t.tags : [], skill_requirements: requirements.filter((r: any) => r.task_id === t.id),
    }));
    if (allocations.length) store.allocations = allocations.map((a: any) => ({ ...a }));
    if (events.length) store.events = events.map((e: any) => ({ ...e }));
    if (audits.length) store.auditLogs = audits.map((a: any) => ({
      ...a, before_state: a.before_state || {}, after_state: a.after_state || {},
    }));
    if (gaps.length) store.skillGaps = gaps.map((g: any) => ({ ...g, related_events: g.related_events || [] }));
    if (settings[0]) store.agentSettings = {
      ...settings[0], sla_lookahead_hours: Number(settings[0].sla_lookahead_hours),
      sla_scan_interval_minutes: Number(settings[0].sla_scan_interval_minutes),
      workload_soft_limit: Number(settings[0].workload_soft_limit), workload_hard_limit: Number(settings[0].workload_hard_limit),
    };
    // The simplified schema has no proposal table. Proposals are checkpointed
    // in PERSON_UNAVAILABLE event payloads so approval survives a restart.
    store.proposals = events.flatMap((e: any) => e.payload?.proposal ? [e.payload.proposal] : []);
    store.recalculateAllWorkloads();
  }

  async persist(store: ReflexStore) {
    // The executed schema uses uuid keys for child tables while the offline
    // demo uses readable IDs. Normalize once before writing so foreign keys
    // (especially audit_logs.event_id) remain consistent across restarts.
    for (const employee of store.employees) {
      for (const skill of employee.skills) skill.id = uuid(skill.id);
      for (const item of employee.availability || []) item.id = uuid(item.id);
    }
    for (const task of store.tasks) for (const requirement of task.skill_requirements) requirement.id = uuid(requirement.id);
    for (const allocation of store.allocations) allocation.id = uuid(allocation.id);
    for (const event of store.events) event.id = uuid(event.id);
    for (const audit of store.auditLogs) {
      audit.id = uuid(audit.id);
      if (audit.event_id) audit.event_id = uuid(audit.event_id);
    }
    for (const gap of store.skillGaps) gap.id = uuid(gap.id);
    for (const proposal of store.proposals) {
      proposal.id = uuid(proposal.id);
      if (proposal.event_id) proposal.event_id = uuid(proposal.event_id);
      for (const item of proposal.items) item.id = uuid(item.id);
    }
    const employeeRows = store.employees.map(({ skills, availability, activeAllocationsCount, ...e }) => e);
    await Promise.all([
      upsert('users', store.users.map((u, i) => ({ id: (store as any).__userDbIds?.get(u.authUserId) || uuid(`user:${u.authUserId || i}`), auth_user_id: u.authUserId, role: u.role, employee_id: u.employeeId, name: u.name, email: u.email, avatar_url: u.avatar_url }))),
      upsert('employees', employeeRows),
      upsert('employee_skills', store.employees.flatMap(e => e.skills)),
      upsert('employee_availability', store.employees.flatMap(e => (e.availability || []))),
      upsert('tasks', store.tasks.map(({ skill_requirements, allocations, ...t }) => ({ ...t, tags: t.tags || [] }))),
      upsert('task_skill_requirements', store.tasks.flatMap(t => t.skill_requirements)),
      upsert('allocations', store.allocations),
      upsert('audit_logs', store.auditLogs.map(({ task_title, employee_name, ...a }) => a)),
      upsert('skill_gaps', store.skillGaps.map(({ impact_level, recommendation, ...g }) => g)),
      upsert('agent_settings', [{ id: true, ...store.agentSettings }]),
    ]);
    const events = store.events.map(e => {
      const proposal = store.proposals.find(p => p.event_id === e.id);
      return { ...e, payload: proposal ? { ...e.payload, proposal } : e.payload };
    });
    await upsert('events', events);
  }
}
