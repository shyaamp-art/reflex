-- Reflex demo seed for a Supabase/Postgres database.
--
-- This file is intentionally not executed by the demo and contains no
-- credentials. It is idempotent: rerunning it updates the rows identified by
-- their deterministic UUIDs. The in-memory store remains the offline default.
--
-- The CREATE TABLE statements make this artifact usable in a fresh demo
-- schema. Production migrations may already provide equivalent tables; in
-- that case keep the migrations as the source of truth and adapt column names
-- before applying this seed.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key,
  auth_user_id text unique not null,
  role text not null,
  employee_id text,
  name text not null,
  email text not null,
  avatar_url text
);

create table if not exists public.employees (
  id text primary key,
  name text not null,
  email text not null,
  team text not null,
  role_title text not null,
  seniority text not null,
  status text not null,
  work_mode text not null,
  weekly_capacity_hours numeric not null,
  current_workload_percent numeric not null default 0,
  performance_score numeric not null,
  location text not null,
  timezone text not null,
  avatar_url text
);

create table if not exists public.employee_skills (
  id uuid primary key,
  employee_id text not null references public.employees(id) on delete cascade,
  skill_name text not null,
  proficiency text not null,
  verified boolean not null default true
);

create table if not exists public.employee_availability (
  id uuid primary key,
  employee_id text not null references public.employees(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  is_available boolean not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id text primary key,
  title text not null,
  description text not null,
  status text not null,
  priority text not null,
  sla_deadline timestamptz not null,
  estimated_effort numeric not null,
  tags jsonb not null default '[]'::jsonb,
  required_location text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.task_skill_requirements (
  id uuid primary key,
  task_id text not null references public.tasks(id) on delete cascade,
  skill_name text not null,
  proficiency text not null,
  people_required integer not null default 1,
  requirement_type text not null
);

create table if not exists public.allocations (
  id uuid primary key,
  task_id text not null references public.tasks(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  status text not null,
  allocated_by text not null,
  allocated_at timestamptz not null,
  released_at timestamptz
);

create table if not exists public.events (
  id uuid primary key,
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null
);

create table if not exists public.audit_logs (
  id uuid primary key,
  task_id text references public.tasks(id) on delete set null,
  employee_id text,
  event_id uuid references public.events(id) on delete set null,
  action text not null,
  triggered_by text not null,
  actor_user_id text,
  actor_name text,
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  reason text not null,
  created_at timestamptz not null
);

create table if not exists public.skill_gaps (
  id uuid primary key,
  skill_name text unique not null,
  times_failed integer not null,
  related_events jsonb not null default '[]'::jsonb,
  last_occurred timestamptz not null,
  recommendation_strength numeric not null,
  suggested_hiring_priority integer not null,
  reviewed_at timestamptz,
  reviewed_by text
);

create table if not exists public.agent_settings (
  id boolean primary key default true check (id),
  sla_lookahead_hours numeric not null,
  sla_scan_interval_minutes numeric not null,
  workload_soft_limit numeric not null,
  workload_hard_limit numeric not null,
  updated_at timestamptz not null
);

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
  auth_user_id = excluded.auth_user_id, role = excluded.role,
  employee_id = excluded.employee_id, name = excluded.name, email = excluded.email;

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
on conflict (id) do update set
  employee_id = excluded.employee_id, skill_name = excluded.skill_name,
  proficiency = excluded.proficiency, verified = excluded.verified;

insert into public.employee_availability
  (id, employee_id, start_date, end_date, is_available, reason)
values
  ('00000000-0000-0000-0000-000000002001', 'emp-1', current_date, current_date + 30, true, 'Regular working availability'),
  ('00000000-0000-0000-0000-000000002002', 'emp-2', current_date, current_date + 30, true, 'Regular working availability'),
  ('00000000-0000-0000-0000-000000002003', 'emp-3', current_date, current_date + 30, true, 'Regular working availability'),
  ('00000000-0000-0000-0000-000000002004', 'emp-4', current_date, current_date + 30, true, 'Regular working availability'),
  ('00000000-0000-0000-0000-000000002005', 'emp-5', current_date, current_date + 30, true, 'Regular working availability'),
  ('00000000-0000-0000-0000-000000002006', 'emp-6', current_date, current_date + 30, true, 'Regular working availability')
on conflict (id) do update set
  start_date = excluded.start_date, end_date = excluded.end_date,
  is_available = excluded.is_available, reason = excluded.reason;

insert into public.tasks
  (id, title, description, status, priority, sla_deadline, estimated_effort, tags, required_location, created_at, updated_at)
values
  ('task-1', 'Payment Webhook Idempotency & Latency Remediation', 'Resolve webhook timeout anomalies and enforce Redis lock deduplication.', 'ASSIGNED', 'HIGH', now() + interval '18 hours', 16, '["stripe","payments","redis","backend"]', 'REMOTE', now() - interval '1 day', now() - interval '12 hours'),
  ('task-2', 'Kubernetes Ingress Controller Memory Spike Mitigation', 'Tune Envoy proxy buffers and stop production pod eviction cycles.', 'IN_PROGRESS', 'HIGH', now() + interval '2.5 hours', 12, '["kubernetes","aws","docker","infrastructure"]', 'HYBRID', now() - interval '8 hours', now() - interval '2 hours'),
  ('task-3', 'Cross-Region PostgreSQL Read Replica Synchronization', 'Configure logical replication and verify read consistency.', 'ASSIGNED', 'HIGH', now() + interval '48 hours', 20, '["postgresql","database","system design"]', 'REMOTE', now() - interval '36 hours', now() - interval '10 hours'),
  ('task-4', 'Kafka Event Backpressure Buffer Hardening', 'Resolve consumer lag and optimize analytics consumer groups.', 'UNASSIGNED', 'MEDIUM', now() + interval '72 hours', 14, '["kafka","streaming","python"]', 'HYBRID', now() - interval '6 hours', now() - interval '6 hours')
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
on conflict (id) do update set
  task_id = excluded.task_id, skill_name = excluded.skill_name,
  proficiency = excluded.proficiency, people_required = excluded.people_required,
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
