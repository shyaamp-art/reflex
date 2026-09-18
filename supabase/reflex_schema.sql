-- Reflex compatible Supabase schema and deterministic demo data.
--
-- This file is intended for a fresh development/demo database. It matches the
-- current Express adapter in server/db/repository.ts and the domain types in
-- src/types/index.ts.
--
-- Important:
--   * It uses readable text IDs because the current application uses emp-1 and
--     task-1 style identifiers.
--   * Workload is recalculated by the application after hydration and mutation;
--     this schema intentionally does not add competing workload triggers.
--   * Availability rows are exception windows. Do not seed overlapping normal
--     availability windows and leave windows in the same table.
--   * This is not a production migration. Convert it into ordered migrations
--     and replace demo identity/RLS policies before production deployment.

create extension if not exists pgcrypto;

-- ============================================================================
-- 1. Core tables
-- ============================================================================

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id text unique not null,
  role text not null check (role in ('MANAGER', 'EMPLOYEE')),
  employee_id text,
  name text not null,
  email text not null unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.employees (
  id text primary key,
  name text not null,
  email text not null unique,
  team text not null,
  role_title text not null,
  seniority text not null check (seniority in ('JUNIOR', 'MID', 'SENIOR', 'LEAD', 'PRINCIPAL')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE', 'AVAILABLE', 'UNAVAILABLE')),
  work_mode text not null default 'REMOTE' check (work_mode in ('REMOTE', 'HYBRID', 'ONSITE')),
  weekly_capacity_hours numeric not null default 40 check (weekly_capacity_hours > 0),
  current_workload_percent numeric(6,2) not null default 0 check (current_workload_percent >= 0 and current_workload_percent <= 100),
  performance_score numeric(3,2) not null default 3.5 check (performance_score >= 0 and performance_score <= 5),
  location text not null,
  timezone text not null default 'UTC',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_employees_status on public.employees(status);
create index if not exists idx_employees_team on public.employees(team);

create table if not exists public.employee_skills (
  id uuid primary key default gen_random_uuid(),
  employee_id text not null references public.employees(id) on delete cascade,
  skill_name text not null,
  proficiency text not null check (proficiency in ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
  verified boolean not null default true,
  unique (employee_id, skill_name)
);

create index if not exists idx_employee_skills_employee on public.employee_skills(employee_id);
create index if not exists idx_employee_skills_skill on public.employee_skills(skill_name);

-- Store exception windows only. A normal employee has no row; a leave row has
-- is_available = false. This avoids conflicts between a broad "available"
-- window and a narrower leave window.
create table if not exists public.employee_availability (
  id uuid primary key default gen_random_uuid(),
  employee_id text not null references public.employees(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  is_available boolean not null default false,
  reason text not null,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists idx_employee_availability_employee on public.employee_availability(employee_id);
create index if not exists idx_employee_availability_dates on public.employee_availability(start_date, end_date);

create table if not exists public.tasks (
  id text primary key,
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  priority text not null check (priority in ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  sla_deadline timestamptz not null,
  estimated_effort numeric not null check (estimated_effort > 0),
  actual_effort numeric check (actual_effort >= 0),
  tags jsonb not null default '[]'::jsonb,
  status text not null default 'UNASSIGNED' check (status in ('UNASSIGNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD')),
  required_location text not null default 'REMOTE' check (required_location in ('REMOTE', 'HYBRID', 'ONSITE')),
  created_by text references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(tags) = 'array')
);

create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_priority on public.tasks(priority);
create index if not exists idx_tasks_sla_deadline on public.tasks(sla_deadline);
create index if not exists idx_tasks_created_by on public.tasks(created_by);
create index if not exists idx_tasks_tags on public.tasks using gin(tags);

create table if not exists public.task_skill_requirements (
  id uuid primary key default gen_random_uuid(),
  task_id text not null references public.tasks(id) on delete cascade,
  skill_name text not null,
  proficiency text not null check (proficiency in ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
  people_required integer not null default 1 check (people_required > 0),
  requirement_type text not null default 'MUST_HAVE' check (requirement_type in ('MUST_HAVE', 'NICE_TO_HAVE')),
  unique (task_id, skill_name)
);

create index if not exists idx_task_requirements_task on public.task_skill_requirements(task_id);
create index if not exists idx_task_requirements_skill on public.task_skill_requirements(skill_name);

create table if not exists public.allocations (
  id uuid primary key default gen_random_uuid(),
  task_id text not null references public.tasks(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  role_note text,
  score numeric,
  allocated_by text not null default 'AI' check (allocated_by in ('AI', 'MANUAL')),
  allocated_at timestamptz not null default now(),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'RELEASED')),
  released_at timestamptz
);

create index if not exists idx_allocations_task on public.allocations(task_id);
create index if not exists idx_allocations_employee on public.allocations(employee_id);
create unique index if not exists idx_allocations_one_active_per_pair
  on public.allocations(task_id, employee_id)
  where status = 'ACTIVE';

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('PERSON_UNAVAILABLE', 'NEW_TASK', 'PRIORITY_CHANGE', 'SLA_RISK')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(payload) = 'object')
);

create index if not exists idx_events_type on public.events(type);
create index if not exists idx_events_created_at on public.events(created_at desc);
create index if not exists idx_events_task on public.events using gin(payload);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  task_id text references public.tasks(id) on delete set null,
  employee_id text references public.employees(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  action text not null check (action in ('ALLOCATED', 'REALLOCATED', 'RELEASED', 'PRIORITY_ESCALATED', 'SLA_RISK')),
  triggered_by text not null check (triggered_by in ('AI', 'MANAGER')),
  actor_user_id text,
  actor_name text,
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_task on public.audit_logs(task_id);
create index if not exists idx_audit_logs_employee on public.audit_logs(employee_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

create table if not exists public.skill_gaps (
  id uuid primary key default gen_random_uuid(),
  skill_name text unique not null,
  times_failed integer not null default 0 check (times_failed >= 0),
  related_events jsonb not null default '[]'::jsonb,
  last_occurred timestamptz not null default now(),
  recommendation_strength numeric not null default 0 check (recommendation_strength >= 0 and recommendation_strength <= 1),
  suggested_hiring_priority integer not null default 3 check (suggested_hiring_priority between 1 and 3),
  impact_level text,
  recommendation text,
  reviewed_at timestamptz,
  reviewed_by text
);

create table if not exists public.agent_settings (
  id boolean primary key default true check (id),
  sla_lookahead_hours numeric not null default 4 check (sla_lookahead_hours > 0),
  sla_scan_interval_minutes numeric not null default 15 check (sla_scan_interval_minutes > 0),
  workload_soft_limit numeric not null default 85 check (workload_soft_limit between 0 and 100),
  workload_hard_limit numeric not null default 100 check (workload_hard_limit between 0 and 100),
  updated_at timestamptz not null default now(),
  check (workload_soft_limit <= workload_hard_limit)
);

-- Catalog table for future settings synchronization. The current demo still
-- loads its visible catalog from the process store.
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text unique not null check (name = lower(name)),
  created_at timestamptz not null default now()
);

-- Durable proposal tables are included for the planned production expansion.
-- The current adapter continues to checkpoint proposals in event payloads.
create table if not exists public.allocation_proposals (
  id uuid primary key default gen_random_uuid(),
  task_id text not null references public.tasks(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  proposal_type text not null check (proposal_type in ('INITIAL_ALLOCATION', 'REALLOCATION', 'PRIORITY_REALLOCATION')),
  status text not null check (status in ('PENDING', 'PROPOSED', 'APPROVED', 'OVERRIDDEN', 'REJECTED', 'EXPIRED', 'NO_FEASIBLE_MATCH')),
  summary text not null,
  explanation text not null,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by text,
  decision_note text
);

create index if not exists idx_allocation_proposals_task on public.allocation_proposals(task_id);
create index if not exists idx_allocation_proposals_status on public.allocation_proposals(status);

create table if not exists public.allocation_proposal_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.allocation_proposals(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  rank integer not null check (rank > 0),
  score numeric not null,
  skill_match numeric not null,
  availability numeric not null,
  workload numeric not null,
  performance numeric not null,
  sla_safety numeric not null,
  location numeric not null,
  reason text not null,
  role_note text,
  selected boolean not null default false,
  unique (proposal_id, employee_id)
);

-- ============================================================================
-- 2. Safe timestamp helpers and read-only view
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_employees_updated_at on public.employees;
create trigger trg_employees_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

drop trigger if exists trg_agent_settings_updated_at on public.agent_settings;
create trigger trg_agent_settings_updated_at
before update on public.agent_settings
for each row execute function public.set_updated_at();

create or replace view public.task_current_assignees
with (security_invoker = true)
as
select
  a.task_id,
  a.employee_id,
  a.role_note,
  a.score,
  a.allocated_by,
  a.allocated_at
from public.allocations a
where a.status = 'ACTIVE';

grant select on public.task_current_assignees to authenticated;

-- ============================================================================
-- 3. Development RLS
-- ============================================================================
-- These policies support the current controlled demo. They are intentionally
-- broad and must be replaced with role-aware policies before production.

alter table public.users enable row level security;
alter table public.employees enable row level security;
alter table public.employee_skills enable row level security;
alter table public.employee_availability enable row level security;
alter table public.tasks enable row level security;
alter table public.task_skill_requirements enable row level security;
alter table public.allocations enable row level security;
alter table public.events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.skill_gaps enable row level security;
alter table public.agent_settings enable row level security;
alter table public.skills enable row level security;
alter table public.allocation_proposals enable row level security;
alter table public.allocation_proposal_items enable row level security;

-- Policy names are unique per table. Drop/recreate makes this section safe to
-- rerun in a development database.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'users', 'employees', 'employee_skills', 'employee_availability',
    'tasks', 'task_skill_requirements', 'allocations', 'events',
    'audit_logs', 'skill_gaps', 'agent_settings', 'skills',
    'allocation_proposals', 'allocation_proposal_items'
  ] loop
    execute format('drop policy if exists "Authenticated read" on public.%I', table_name);
    execute format('create policy "Authenticated read" on public.%I for select to authenticated using (true)', table_name);
  end loop;
end;
$$;

-- ============================================================================
-- 4. Deterministic sample data
-- ============================================================================
-- This seed intentionally does not insert broad availability rows. Leave and
-- availability exceptions can then be added without exclusion conflicts.

insert into public.users (id, auth_user_id, role, employee_id, name, email)
values
  ('00000000-0000-0000-0000-000000000101', 'user-manager-1', 'MANAGER', null, 'Alex Rivera', 'alex.rivera@reflex.internal'),
  ('00000000-0000-0000-0000-000000000102', 'user-emp-1', 'EMPLOYEE', 'emp-1', 'Vikram Malhotra', 'vikram.m@reflex.internal'),
  ('00000000-0000-0000-0000-000000000103', 'user-emp-2', 'EMPLOYEE', 'emp-2', 'Elena Rostova', 'elena.r@reflex.internal'),
  ('00000000-0000-0000-0000-000000000104', 'user-emp-3', 'EMPLOYEE', 'emp-3', 'David Chen', 'david.c@reflex.internal'),
  ('00000000-0000-0000-0000-000000000105', 'user-emp-4', 'EMPLOYEE', 'emp-4', 'Maya Lin', 'maya.l@reflex.internal'),
  ('00000000-0000-0000-0000-000000000106', 'user-emp-5', 'EMPLOYEE', 'emp-5', 'Marcus Vance', 'marcus.v@reflex.internal'),
  ('00000000-0000-0000-0000-000000000107', 'user-emp-6', 'EMPLOYEE', 'emp-6', 'Aisha Morales', 'aisha.m@reflex.internal')
on conflict (id) do update set
  auth_user_id = excluded.auth_user_id,
  role = excluded.role,
  employee_id = excluded.employee_id,
  name = excluded.name,
  email = excluded.email;

insert into public.employees
  (id, name, email, team, role_title, seniority, status, work_mode,
   weekly_capacity_hours, current_workload_percent, performance_score, location, timezone)
values
  ('emp-1', 'Vikram Malhotra', 'vikram.m@reflex.internal', 'Backend', 'Staff Backend Engineer', 'LEAD', 'ACTIVE', 'REMOTE', 40, 65, 4.8, 'Bengaluru, IN (IST)', 'Asia/Kolkata'),
  ('emp-2', 'Elena Rostova', 'elena.r@reflex.internal', 'Infrastructure', 'Principal DevOps Architect', 'LEAD', 'ACTIVE', 'HYBRID', 40, 50, 4.9, 'London, UK (GMT)', 'Europe/London'),
  ('emp-3', 'David Chen', 'david.c@reflex.internal', 'Frontend', 'Senior Frontend Engineer', 'SENIOR', 'ACTIVE', 'REMOTE', 40, 45, 4.6, 'San Francisco, CA (PST)', 'America/Los_Angeles'),
  ('emp-4', 'Maya Lin', 'maya.l@reflex.internal', 'Backend', 'Senior Backend Engineer', 'SENIOR', 'ACTIVE', 'REMOTE', 40, 30, 4.7, 'Toronto, CA (EST)', 'America/Toronto'),
  ('emp-5', 'Marcus Vance', 'marcus.v@reflex.internal', 'Data & Stream', 'Senior Data Platform Engineer', 'SENIOR', 'ACTIVE', 'HYBRID', 40, 75, 4.5, 'New York, NY (EST)', 'America/New_York'),
  ('emp-6', 'Aisha Morales', 'aisha.m@reflex.internal', 'Security & QA', 'Lead Security Systems Engineer', 'LEAD', 'ACTIVE', 'ONSITE', 40, 40, 4.8, 'San Francisco, CA (PST)', 'America/Los_Angeles')
on conflict (id) do update set
  name = excluded.name, email = excluded.email, team = excluded.team,
  role_title = excluded.role_title, seniority = excluded.seniority,
  status = excluded.status, work_mode = excluded.work_mode,
  weekly_capacity_hours = excluded.weekly_capacity_hours,
  current_workload_percent = excluded.current_workload_percent,
  performance_score = excluded.performance_score, location = excluded.location,
  timezone = excluded.timezone;

insert into public.skills (name)
values
  ('aws'), ('ci/cd'), ('docker'), ('graphql'), ('kafka'), ('kubernetes'),
  ('next.js'), ('node.js'), ('postgresql'), ('python'), ('react'), ('redis'),
  ('security audit'), ('stripe'), ('system design'), ('tailwindcss'), ('typescript')
on conflict (name) do nothing;

insert into public.employee_skills (id, employee_id, skill_name, proficiency)
values
  ('00000000-0000-0000-0000-000000001001', 'emp-1', 'stripe', 'EXPERT'),
  ('00000000-0000-0000-0000-000000001002', 'emp-1', 'postgresql', 'ADVANCED'),
  ('00000000-0000-0000-0000-000000001003', 'emp-1', 'node.js', 'ADVANCED'),
  ('00000000-0000-0000-0000-000000001004', 'emp-1', 'system design', 'EXPERT'),
  ('00000000-0000-0000-0000-000000001005', 'emp-1', 'redis', 'ADVANCED'),
  ('00000000-0000-0000-0000-000000001006', 'emp-2', 'kubernetes', 'EXPERT'),
  ('00000000-0000-0000-0000-000000001007', 'emp-2', 'aws', 'EXPERT'),
  ('00000000-0000-0000-0000-000000001008', 'emp-2', 'docker', 'EXPERT'),
  ('00000000-0000-0000-0000-000000001009', 'emp-2', 'ci/cd', 'ADVANCED'),
  ('00000000-0000-0000-0000-000000001010', 'emp-2', 'kafka', 'INTERMEDIATE'),
  ('00000000-0000-0000-0000-000000001011', 'emp-3', 'react', 'EXPERT'),
  ('00000000-0000-0000-0000-000000001012', 'emp-3', 'typescript', 'EXPERT'),
  ('00000000-0000-0000-0000-000000001013', 'emp-3', 'next.js', 'ADVANCED'),
  ('00000000-0000-0000-0000-000000001014', 'emp-4', 'stripe', 'ADVANCED'),
  ('00000000-0000-0000-0000-000000001015', 'emp-4', 'postgresql', 'EXPERT'),
  ('00000000-0000-0000-0000-000000001016', 'emp-4', 'python', 'ADVANCED'),
  ('00000000-0000-0000-0000-000000001017', 'emp-5', 'kafka', 'EXPERT'),
  ('00000000-0000-0000-0000-000000001018', 'emp-5', 'python', 'ADVANCED'),
  ('00000000-0000-0000-0000-000000001019', 'emp-5', 'redis', 'ADVANCED'),
  ('00000000-0000-0000-0000-000000001020', 'emp-6', 'security audit', 'EXPERT'),
  ('00000000-0000-0000-0000-000000001021', 'emp-6', 'postgresql', 'ADVANCED'),
  ('00000000-0000-0000-0000-000000001022', 'emp-6', 'aws', 'ADVANCED'),
  ('00000000-0000-0000-0000-000000001023', 'emp-6', 'kubernetes', 'EXPERT')
on conflict (employee_id, skill_name) do update set
  proficiency = excluded.proficiency,
  verified = excluded.verified;

insert into public.tasks
  (id, title, description, status, priority, sla_deadline, estimated_effort, tags, required_location, created_at, updated_at)
values
  ('task-1', 'Payment Webhook Idempotency & Latency Remediation', 'Resolve webhook timeout anomalies and enforce Redis lock deduplication.', 'ASSIGNED', 'HIGH', now() + interval '18 hours', 16, '["stripe", "payments", "redis", "backend"]', 'REMOTE', now() - interval '1 day', now() - interval '12 hours'),
  ('task-2', 'Kubernetes Ingress Controller Memory Spike Mitigation', 'Tune Envoy proxy buffers and stop production pod eviction cycles.', 'IN_PROGRESS', 'HIGH', now() + interval '2.5 hours', 12, '["kubernetes", "aws", "docker", "infrastructure"]', 'HYBRID', now() - interval '8 hours', now() - interval '2 hours'),
  ('task-3', 'Cross-Region PostgreSQL Read Replica Synchronization', 'Configure logical replication and verify read consistency.', 'ASSIGNED', 'HIGH', now() + interval '48 hours', 20, '["postgresql", "database", "system design"]', 'REMOTE', now() - interval '36 hours', now() - interval '10 hours'),
  ('task-4', 'Kafka Event Backpressure Buffer Hardening', 'Resolve consumer lag and optimize analytics consumer groups.', 'UNASSIGNED', 'MEDIUM', now() + interval '72 hours', 14, '["kafka", "streaming", "python"]', 'HYBRID', now() - interval '6 hours', now() - interval '6 hours')
on conflict (id) do update set
  title = excluded.title, description = excluded.description, status = excluded.status,
  priority = excluded.priority, sla_deadline = excluded.sla_deadline,
  estimated_effort = excluded.estimated_effort, tags = excluded.tags,
  required_location = excluded.required_location, updated_at = excluded.updated_at;

insert into public.task_skill_requirements
  (id, task_id, skill_name, proficiency, people_required, requirement_type)
values
  ('00000000-0000-0000-0000-000000003001', 'task-1', 'stripe', 'ADVANCED', 1, 'MUST_HAVE'),
  ('00000000-0000-0000-0000-000000003002', 'task-1', 'redis', 'ADVANCED', 1, 'NICE_TO_HAVE'),
  ('00000000-0000-0000-0000-000000003003', 'task-2', 'kubernetes', 'EXPERT', 1, 'MUST_HAVE'),
  ('00000000-0000-0000-0000-000000003004', 'task-2', 'aws', 'ADVANCED', 1, 'MUST_HAVE'),
  ('00000000-0000-0000-0000-000000003005', 'task-3', 'postgresql', 'ADVANCED', 1, 'MUST_HAVE'),
  ('00000000-0000-0000-0000-000000003006', 'task-4', 'kafka', 'ADVANCED', 1, 'MUST_HAVE')
on conflict (task_id, skill_name) do update set
  proficiency = excluded.proficiency,
  people_required = excluded.people_required,
  requirement_type = excluded.requirement_type;

insert into public.allocations
  (id, task_id, employee_id, status, allocated_by, allocated_at)
values
  ('00000000-0000-0000-0000-000000004001', 'task-1', 'emp-1', 'ACTIVE', 'AI', now() - interval '12 hours'),
  ('00000000-0000-0000-0000-000000004002', 'task-2', 'emp-2', 'ACTIVE', 'AI', now() - interval '6 hours'),
  ('00000000-0000-0000-0000-000000004003', 'task-3', 'emp-4', 'ACTIVE', 'MANUAL', now() - interval '10 hours')
on conflict (id) do update set
  task_id = excluded.task_id, employee_id = excluded.employee_id,
  status = excluded.status, allocated_by = excluded.allocated_by,
  allocated_at = excluded.allocated_at;

insert into public.events (id, type, payload, created_at)
values
  ('00000000-0000-0000-0000-000000005001', 'NEW_TASK', '{"task_id":"task-1","title":"Payment Webhook Idempotency & Latency Remediation"}', now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000005002', 'SLA_RISK', '{"task_id":"task-2","title":"Kubernetes Ingress Controller Memory Spike Mitigation","hours_remaining":2.5}', now() - interval '1 hour')
on conflict (id) do update set
  type = excluded.type, payload = excluded.payload, created_at = excluded.created_at;

insert into public.audit_logs
  (id, task_id, employee_id, event_id, action, triggered_by, actor_user_id, actor_name, before_state, after_state, reason, created_at)
values
  ('00000000-0000-0000-0000-000000006001', 'task-1', 'emp-1', '00000000-0000-0000-0000-000000005001', 'ALLOCATED', 'AI', 'user-manager-1', 'Alex Rivera', '{"status":"UNASSIGNED"}', '{"status":"ASSIGNED","assigned_employees":["Vikram Malhotra"]}', 'Optimal match with expert Stripe proficiency and safe workload.', now() - interval '12 hours'),
  ('00000000-0000-0000-0000-000000006002', 'task-2', 'emp-2', null, 'ALLOCATED', 'AI', 'user-manager-1', 'Alex Rivera', '{"status":"UNASSIGNED"}', '{"status":"IN_PROGRESS","assigned_employees":["Elena Rostova"]}', 'Lead DevOps coverage for Kubernetes and AWS.', now() - interval '6 hours'),
  ('00000000-0000-0000-0000-000000006003', 'task-2', 'emp-2', '00000000-0000-0000-0000-000000005002', 'PRIORITY_ESCALATED', 'AI', null, 'SLA Automated Worker', '{"priority":"HIGH"}', '{"priority":"CRITICAL"}', 'Deadline is approaching within the SLA lookahead window.', now() - interval '1 hour')
on conflict (id) do update set
  task_id = excluded.task_id, employee_id = excluded.employee_id,
  event_id = excluded.event_id, action = excluded.action,
  triggered_by = excluded.triggered_by, before_state = excluded.before_state,
  after_state = excluded.after_state, reason = excluded.reason;

insert into public.skill_gaps
  (id, skill_name, times_failed, related_events, last_occurred, recommendation_strength, suggested_hiring_priority)
values
  ('00000000-0000-0000-0000-000000007001', 'kafka', 4, '["00000000-0000-0000-0000-000000005002"]', now() - interval '6 hours', 0.8, 2),
  ('00000000-0000-0000-0000-000000007002', 'security audit', 2, '[]', now() - interval '48 hours', 0.4, 3)
on conflict (id) do update set
  skill_name = excluded.skill_name, times_failed = excluded.times_failed,
  related_events = excluded.related_events, last_occurred = excluded.last_occurred,
  recommendation_strength = excluded.recommendation_strength,
  suggested_hiring_priority = excluded.suggested_hiring_priority;

insert into public.agent_settings
  (id, sla_lookahead_hours, sla_scan_interval_minutes, workload_soft_limit, workload_hard_limit, updated_at)
values (true, 4, 15, 85, 100, now())
on conflict (id) do update set
  sla_lookahead_hours = excluded.sla_lookahead_hours,
  sla_scan_interval_minutes = excluded.sla_scan_interval_minutes,
  workload_soft_limit = excluded.workload_soft_limit,
  workload_hard_limit = excluded.workload_hard_limit,
  updated_at = excluded.updated_at;

-- Optional read-only grants for Supabase clients. The service-role adapter used
-- by the current server bypasses RLS, while these grants make authenticated
-- reads possible for future clients.
grant usage on schema public to authenticated;
grant select on all tables in schema public to authenticated;
