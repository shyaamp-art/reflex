# REFLEX — Reconciled Master Plan & Production Execution Blueprint

**Project:** Reflex  
**Problem Statement:** AI-04 — AI Workforce Decision & Resource Allocation Agent  
**Document purpose:** Reconcile the original Plan of Action with the current repository, record completed work, define the corrected target architecture, and provide an implementation blueprint that an AI coding model can execute file-by-file without inventing schemas, routes, or responsibilities.

**Status:** Updated master plan as of 18 September 2026  
**Primary implementation target:** Next.js App Router + TypeScript + Supabase + deterministic workforce engine + LLM explanation layer  
**Deployment target used by this blueprint:** Vercel for Next.js application/cron + Supabase for Postgres/Auth/Realtime

---

# 0. SOURCE OF TRUTH AND CURRENT REALITY

This document supersedes the older Plan of Action where the old plan conflicts with the actual repository or with the production requirements of the current Reflex architecture.

The original objective remains unchanged: Reflex must allocate individual employees to competing tasks, continuously reconsider those allocations when conditions change, explain decisions, and surface recurring skill shortages. The original plan explicitly identifies dynamic reallocation as the primary goal rather than one-time assignment.

The supplied SQL plan already contains the core employee/task/skill/availability/allocation/event/audit/skill-gap tables, Realtime publication, RLS, workload triggers, and a periodic SLA escalation job. It also documents several deliberate fixes to the earlier SQL, including moving Realtime publication after table creation, pinning trigger search paths, locking the task row for headcount enforcement, and schema-qualifying the cron invocation.

The current frontend repository, however, contains no `app/api/**` route handlers, no worker/service layer, and no production mutation layer. The application imports `INITIAL_*` mock datasets throughout both manager and employee pages. Supabase client scaffolding exists, but the UI is not yet connected to live domain data.

Therefore the project is currently best classified as:

> **A substantially built frontend prototype + database foundation, awaiting the production application/service/agent layer and live frontend integration.**

---

# SECTION 1 — RETROSPECTIVE & EXECUTIVE SUMMARY: WHAT WE HAVE DONE

## 1.1 System architecture to date

### Frontend

The repository has converged on a Next.js App Router application using React and TypeScript. The package currently declares Next.js `16.3.5`, React 18, Tailwind CSS, TanStack React Query, Zustand, React Hook Form, Zod, Supabase SSR/client libraries, Recharts, Radix UI primitives, date-fns, Sonner, and drag-and-drop support.

The route structure already models the two intended product roles:

```text
app/
├── (auth)/login
├── manager/
│   ├── dashboard
│   ├── tasks
│   │   ├── new
│   │   └── [id]
│   ├── employees
│   │   └── [id]
│   ├── reallocations
│   ├── skill-gaps
│   ├── audit
│   └── settings
└── employee/
    ├── dashboard
    ├── tasks
    ├── availability
    └── profile
```

The UI shell is already modularized into `AppShell`, `Sidebar`, `TopBar`, `NotificationBell`, and `DrawerHost`. Decision-oriented drawers also exist for AI recommendations, manual allocation, event details, reasoning, audit details, confirmations, and task selection.

### State management

TanStack React Query is already installed and configured globally. Zustand is used for UI-only state, particularly drawer state. This is the correct direction for production: React Query should own server state, while Zustand should remain limited to UI state such as open drawers and sidebar state.

The current project has not yet adopted React Query for data retrieval; pages still consume static mock arrays.

### Domain typing

`lib/types.ts` already contains explicit TypeScript contracts for:

- Employee
- EmployeeSkill
- EmployeeAvailability
- Task
- TaskSkillRequirement
- Allocation
- AppEvent
- AllocationLog
- SkillGapEvent
- Skill
- AI suggestion and score breakdown

This is a useful contract layer and should remain, but several unions need reconciliation with the real database contract before production wiring.

### Authentication scaffolding

The project has `lib/supabase/client.ts` and `lib/supabase/server.ts`, and the login page already attempts `supabase.auth.signInWithPassword()`.

However, the current authentication implementation still includes a demo fallback based on local storage and demo manager/employee objects. Route authorization is also performed only in client-side layouts using the stored demo session.

That is suitable for a prototype, not for production authorization.

### Database

The supplied SQL plan contains these core tables:

```text
employees
employee_skills
employee_availability
tasks
task_skill_requirements
allocations
events
allocation_logs
skill_gap_events
```

It also defines indexes, Realtime publication, automatic timestamp triggers, headcount enforcement, workload decrement on completion, SLA escalation, and RLS read policies.

The SQL plan explicitly states that the DB model is intended for one department containing multiple teams, with individual employee allocation as the fundamental unit. That remains the project scope.

### Product flows already represented in UI

The frontend already presents the intended end-to-end product concepts:

1. Manager dashboard showing tasks, workforce, SLA risk, reallocation activity, and skill gaps.
2. New-task creation with required skills, priority, SLA, effort, and AI/manual allocation modes.
3. AI candidate recommendation cards with score, reason, and scoring-factor breakdown.
4. Manual employee selection.
5. Task detail with status, priority, active assignees, release/reallocation actions, reasoning, and audit history.
6. Employee availability/leave form explicitly claiming to trigger automatic reallocation.
7. Employee task progress updates.
8. Manager reallocation center.
9. Skill-gap analysis and export.
10. Audit trail and CSV export.
11. Manager settings for skills and SLA parameters.

The UI is therefore already aligned with the intended product narrative even though the actions are not yet persisted.

---

## 1.2 Key milestones achieved

### Milestone A — Scope was narrowed correctly

The original plan chooses individual employees rather than teams as the allocation unit, using teams only for grouping/filtering. It also narrows the system to one department and makes manager the primary user with employee as the secondary user. These decisions remain valid and avoid unnecessary enterprise complexity.

### Milestone B — The relational model was normalized

The original conceptual `Task.assigned_to` model was replaced with an explicit `allocations` table. This is an important improvement because the final product must support multiple people per task, release/reallocation, allocation history, and explicit active/released state.

### Milestone C — Skills and requirements became first-class relations

`employee_skills` and `task_skill_requirements` make skill-based scoring implementable without parsing free-form task text.

### Milestone D — Availability became a real business entity

The database supports employee availability windows and prevents overlapping availability windows for an employee through an exclusion constraint.

### Milestone E — Event-driven reallocation was preserved

The system explicitly models `PERSON_UNAVAILABLE`, `NEW_TASK`, `PRIORITY_CHANGE`, and `SLA_RISK` events. This is the correct foundation for dynamic behavior.

### Milestone F — Explainability was designed into the system

The current UI already exposes score breakdowns and reasoning. The database stores `before_state`, `after_state`, and an event reference in the allocation audit log. This supports human-reviewable AI behavior rather than an opaque recommendation.

### Milestone G — Skill-gap analysis was promoted to a first-class feature

The original plan added a `SkillGapInsight` concept; the actual schema realizes this as `skill_gap_events`, which can be populated from repeated allocation failures and shortages.

### Milestone H — Infrastructure moved toward Supabase

Instead of a generic SQLite/JSON backend, the actual codebase uses Supabase client libraries. The SQL plan is built around PostgreSQL, Supabase Realtime, Supabase Auth, RLS, and `pg_cron`. The updated architecture therefore standardizes on Supabase instead of maintaining an alternate storage backend.

---

## 1.3 What is NOT actually completed

The following items must not be described as implemented merely because UI controls exist:

- No production API route layer exists.
- No production service/repository layer exists.
- No deterministic allocation engine exists.
- No true AI suggestion calculation exists; current suggestions are hard-coded.
- No reallocation engine exists.
- No durable reallocation proposal model exists.
- No real skill-gap analyzer exists.
- Frontend pages read mock data instead of Supabase.
- Most mutations only change React state or display a toast.
- Employee availability is not persisted.
- Employee profile/skills changes are not persisted.
- Task creation is not persisted.
- Task status/priority changes are not persisted.
- Allocation/release actions are not persisted.
- Manager reallocation approvals are not persisted.
- Skill directory changes are not persisted.
- Realtime subscriptions are not present in the current frontend.
- The client currently trusts a localStorage-based role/session model.
- The current login implementation has a demo bypass.
- Current dashboard URL filters are not fully wired to query parameters.
- The employee task page uses sliced mock tasks rather than the authenticated employee's actual allocations.
- The production migration structure is not yet separated into versioned migrations.

---

## 1.4 Pivots & architectural adjustments

### Pivot 1 — Backend choice

**Original:** FastAPI or Node.js, with SQLite/Supabase/JSON suggested for speed.

**Updated:** Next.js App Router route handlers + service layer + Supabase Postgres/Auth/Realtime.

**Reason:** The repository already uses Next.js, the frontend and backend can share TypeScript/Zod contracts, authentication can be enforced through Supabase SSR, and the coding model can implement the remaining stack without introducing a second runtime unless needed.

### Pivot 2 — Server state strategy

**Original:** Generic frontend/backend separation.

**Updated:** TanStack React Query becomes the only client-side source for server state; Zustand remains UI-only.

**Implication:** `INITIAL_*` mock arrays move into test/seed fixtures and are removed from production pages.

### Pivot 3 — AI responsibility

**Original:** Rule-based scorer + LLM for explanations.

**Updated:** Keep that separation, and make it stricter:

- Deterministic scorer chooses/rejects candidates.
- Deterministic allocator/reallocator decides the actual plan.
- LLM can only generate natural-language explanations from already computed facts.
- LLM is never trusted to select employees, calculate scores, change priorities, or mutate the database.

This sharply reduces hallucination and makes the demo explainable.

### Pivot 4 — Durable proposal state

**Original:** Events plus UI approval were enough conceptually.

**Updated:** Add `allocation_proposals` and `allocation_proposal_items`.

**Reason:** A manager cannot reliably approve an AI recommendation later if the recommendation exists only in volatile React state or an event without structured candidate rows.

### Pivot 5 — Authentication

**Original:** Prototype localStorage session/role handling.

**Updated:** Supabase Auth with SSR cookie sessions, server-side role lookup, and protected route handlers.

Current Supabase guidance for Next.js uses `@supabase/ssr`, cookie-based sessions, and a Next.js `proxy.ts` for token refresh in Next.js 16. The current repository should be brought into that pattern.

### Pivot 6 — Cron ownership

**Original/current SQL:** `pg_cron` owns SLA escalation.

**Updated recommendation:** Put application-level scheduled orchestration in a single Vercel Cron route because the actual allocation/reallocation logic is application code, not SQL. Retain PostgreSQL functions for data invariants only.

The database should not own application orchestration that depends on TypeScript services or an LLM. Otherwise two runtimes become competing sources of truth.

### Pivot 7 — Security model

**Original SQL:** authenticated users receive broad SELECT access to most tables.

**Updated:** Managers may read organization-wide operational data; employees may read only their own profile/availability/skills and tasks/allocations relevant to them. Server-side routes enforce business authorization before mutations.

---

# SECTION 2 — RECONCILED MASTER PLAN & DELTA ANALYSIS

## 2.1 Original vs updated plan

| Area | Original plan | Updated production plan | State |
|---|---|---|---|
| Allocation unit | Individual employees | Individual employees | Keep |
| Scope | One department, multiple teams | Same | Keep |
| Manager | Primary user | Same | Keep |
| Employee | Secondary user | Same | Keep |
| Task | Broken-down task | Same | Keep |
| Storage | SQLite/Supabase/JSON suggested | Supabase Postgres | Changed |
| Backend | FastAPI or Node.js | Next.js route handlers + services | Changed |
| Frontend | Next.js/Tailwind/shadcn | Existing Next.js/Tailwind/Radix UI | Built |
| State | Not specified | React Query server state + Zustand UI state | Added |
| Auth | Not specified | Supabase Auth SSR | Added |
| Allocation | Rule-based scorer | Rule-based deterministic scorer | Keep + formalize |
| LLM | Explanation only | Explanation only | Keep, strict boundary |
| Dynamic reallocation | Core requirement | Core requirement + persisted proposals | Expanded |
| Event store | Events table | Events table | Keep |
| Proposal persistence | Not defined | `allocation_proposals` + items | Added |
| Skills directory | Implied | `skills` table | Added |
| User-role mapping | Implied | `user_profiles` | Added |
| Work mode | Not explicit | `employees.work_mode` | Added to make location compatibility meaningful |
| Audit | DecisionLog | Existing `allocation_logs` + actor identity | Expanded |
| Skill gaps | `skill_gap_events` | Same + reviewed state | Expanded |
| SLA scheduler | pg_cron | Vercel Cron for app orchestration | Changed |
| Realtime | Desired | Supabase Realtime subscriptions | Added |
| API contracts | Not specified | Shared Zod contracts | Added |
| Tests | Not specified | Unit + integration + E2E | Added |
| Deployment | Not specified | Vercel + Supabase | Decided |
| Mobile app | Out of scope | Out of scope | Keep |
| Calendar integrations | Out of scope | Out of scope | Keep |
| OR-Tools | Out of scope | Out of scope | Keep |
| Global optimization | Out of scope | Out of scope | Keep |

---

## 2.2 Current target architecture

```text
                           ┌──────────────────────────┐
                           │        Reflex UI         │
                           │ Next.js / React / RQ     │
                           └────────────┬─────────────┘
                                        │ HTTPS
                                        ▼
                    ┌──────────────────────────────────────┐
                    │ Next.js Route Handlers / API Layer   │
                    │ Auth + validation + role checking   │
                    └────────────────┬─────────────────────┘
                                     │
                  ┌──────────────────┼────────────────────┐
                  │                  │                    │
                  ▼                  ▼                    ▼
           ┌──────────────┐  ┌───────────────┐  ┌────────────────┐
           │ Repositories │  │ Agent Services│  │ Auth Services  │
           └──────┬───────┘  └──────┬────────┘  └──────┬─────────┘
                  │                 │                  │
                  └─────────┬───────┴──────────────────┘
                            ▼
                   ┌───────────────────┐
                   │   Supabase Postgres│
                   │ Auth / RLS / RT    │
                   └─────────┬─────────┘
                             │
             ┌───────────────┼────────────────┐
             │               │                │
             ▼               ▼                ▼
          Events        Allocations         Audit
             │               │                │
             └───────┬───────┴────────────────┘
                     ▼
              Realtime changes
                     │
                     ▼
                 React Query
                     │
                     ▼
                  Reflex UI
```

### External AI boundary

```text
Deterministic candidate facts
        ↓
Explanation service
        ↓
LLM provider
        ↓
Validated explanation JSON
        ↓
UI / proposal record
```

The LLM must never receive credentials, direct database access, or authority to mutate records.

---

## 2.3 Entity relationships

```text
user_profiles
  ├── auth_user_id → auth.users.id
  └── employee_id  → employees.id (nullable for manager)

employees
  ├── employee_skills → skills
  ├── employee_availability
  ├── allocations → tasks
  └── allocation_logs

skills
  ├── employee_skills
  └── task_skill_requirements

tasks
  ├── task_skill_requirements
  ├── allocations
  ├── events
  ├── allocation_logs
  └── allocation_proposals

allocation_proposals
  ├── event
  ├── task
  └── allocation_proposal_items → employees

skill_gap_events
  └── related event IDs
```

---

# 2.4 Corrected scoring specification

The original plan uses five weights but includes Availability while the current frontend displays Location and not Availability. The updated specification explicitly represents all required factors.

### Factor weights

```text
Skill Match        35%
Availability       15%
Low Workload       20%
Performance        10%
SLA Safety         10%
Location/Work Mode 10%
--------------------------------
Total              100%
```

### Hard eligibility rules

A candidate is excluded before scoring when:

1. Employee status is not `ACTIVE`.
2. Employee is unavailable for the current date.
3. Any `MUST_HAVE` task skill is missing or below required proficiency.
4. Projected workload exceeds 100% after assignment.
5. Required work mode is incompatible with the employee's work mode.
6. For a multi-person requirement, selecting the candidate would duplicate an already-selected employee.

### Proficiency values

```text
BEGINNER      = 1
INTERMEDIATE  = 2
ADVANCED      = 3
EXPERT        = 4
```

### Score formulas

`Skill Match`:

- Compute a weighted average of each skill requirement.
- MUST_HAVE weight = 1.0.
- NICE_TO_HAVE weight = 0.5.
- For each skill: `min(actual_level / required_level, 1) * 100`.
- A missing MUST_HAVE is already a hard rejection.

`Availability`:

- 100 if the employee is available today and has no unavailable window intersecting the projected completion horizon.
- 50 if the employee is available today but has a future unavailable window that intersects the projected completion horizon.
- 0 only for an ineligible state; in practice the candidate is filtered out before final scoring.

Projected completion horizon is calculated as:

```text
estimated_effort_hours / 8 = working days
```

added to the current date, rounded up.

`Low Workload`:

```text
projected = current_workload_percent
            + estimated_effort / weekly_capacity_hours * 100

workload_score = max(0, 100 - projected)
```

`Performance`:

```text
performance_score / 5 * 100
```

`SLA Safety`:

- Start at 100.
- Subtract 25 for each active task assigned to that employee with an SLA deadline within 4 hours.
- Subtract 30 if the new task is itself due within 4 hours and projected workload exceeds 90%.
- Clamp to `[0,100]`.
- If projected workload exceeds 100%, reject before scoring.

`Location/Work Mode`:

- `REMOTE` task: 100 for any active employee.
- `HYBRID` task: 100 for `HYBRID` or `ONSITE`; 0 for `REMOTE`.
- `ONSITE` task: 100 for `ONSITE`; 50 for `HYBRID`; 0 for `REMOTE`.

Final score:

```text
0.35*skillMatch +
0.15*availability +
0.20*workload +
0.10*performance +
0.10*slaSafety +
0.10*location
```

The final score is rounded to two decimals.

### Multi-person allocation

Do not simply choose the top N employees.

Use a greedy coverage algorithm:

1. Build the set of unsatisfied MUST_HAVE requirement slots.
2. Rank eligible employees by score.
3. At every step choose the employee that maximizes `new_requirement_coverage * 70 + score * 0.30`.
4. Never exceed a task's required headcount.
5. Recalculate projected workload and SLA safety after each provisional selection.
6. Stop when all MUST_HAVE slots are covered and total requested headcount is satisfied.
7. If no safe candidate can cover an outstanding slot, return `NO_FEASIBLE_MATCH` rather than making an unsafe allocation.

This deliberately favors coverage and safe capacity over simply picking the employee with the highest individual score.

---

# SECTION 3 — END-TO-END MASTER CHECKLIST

## [ ] PHASE 1 — BACKEND COMPLETION

### Database and migrations

- [ ] Convert the current corrected SQL into versioned Supabase migrations.
- [ ] Add `skills` table.
- [ ] Add `user_profiles` table for Auth → role → employee mapping.
- [ ] Add `work_mode` to employees.
- [ ] Add `allocation_proposals` table.
- [ ] Add `allocation_proposal_items` table.
- [ ] Extend `skill_gap_events` with review metadata.
- [ ] Add audit actor identity to `allocation_logs`.
- [ ] Reconcile `allocation_logs.action` values with the frontend.
- [ ] Remove `SKILL_GAP` from generic `events.type`; keep skill gaps in `skill_gap_events`.
- [ ] Add indexes for proposal/event queries.
- [ ] Replace broad authenticated read policies with role-aware RLS.
- [ ] Make cron migration idempotent or remove application orchestration from DB cron.
- [ ] Seed the development database from the existing mock fixture set.

### Backend application layer

- [ ] Create server-only Supabase clients.
- [ ] Create request authentication helper.
- [ ] Create manager/employee authorization helpers.
- [ ] Create repository layer.
- [ ] Create domain scoring engine.
- [ ] Create allocator.
- [ ] Create reallocator.
- [ ] Create proposal service.
- [ ] Create skill-gap analyzer.
- [ ] Create explanation adapter.
- [ ] Create task service.
- [ ] Create employee service.
- [ ] Create availability service.
- [ ] Create audit service.
- [ ] Create SLA service.
- [ ] Add domain error types.
- [ ] Add transaction boundaries.

### Validation and invariants

- [ ] Zod schemas for every API input.
- [ ] Reject client-supplied role or user ID fields.
- [ ] Recalculate allocation scores server-side.
- [ ] Reject stale proposal approvals.
- [ ] Prevent duplicate active task/employee allocations.
- [ ] Release allocations atomically.
- [ ] Recalculate workload after allocation changes.
- [ ] Ensure completed tasks have no active allocations.
- [ ] Ensure required skill counts are satisfiable before final approval.
- [ ] Make reallocation idempotent.

---

## [ ] PHASE 2 — API & INTEGRATION LAYER

- [ ] Add all route handlers listed in Section 4.
- [ ] Add common JSON response/error helpers.
- [ ] Add server-side auth and role checks to every protected route.
- [ ] Add a typed fetch client in `lib/api/client.ts`.
- [ ] Add shared Zod request/response contracts.
- [ ] Add environment validation.
- [ ] Add internal cron authentication.
- [ ] Add rate limiting for expensive AI suggestion endpoints.
- [ ] Add timeout handling for the LLM provider.
- [ ] Add request IDs to server logs and mutation responses.

---

## [ ] PHASE 3 — FRONTEND / BACKEND WIRING

- [ ] Replace mock data imports with React Query hooks.
- [ ] Replace localStorage session with Supabase session.
- [ ] Add `proxy.ts` for SSR auth refresh.
- [ ] Wire manager dashboard to live queries.
- [ ] Wire manager task list filters to URL search params.
- [ ] Wire task creation form to suggestion endpoint.
- [ ] Wire suggestion acceptance to task creation/allocation mutation.
- [ ] Wire task detail status/priority/delete/release actions.
- [ ] Wire manual picker.
- [ ] Wire reallocation center.
- [ ] Wire employee availability CRUD.
- [ ] Wire employee profile/skills CRUD.
- [ ] Wire employee task status changes.
- [ ] Wire skill-gap page.
- [ ] Wire settings skill directory and agent settings.
- [ ] Wire audit page and CSV export.
- [ ] Add Supabase Realtime subscriptions.
- [ ] Invalidate React Query caches after realtime mutations.
- [ ] Add loading, empty, error, retry, and unauthorized states.
- [ ] Fix current asynchronous `form.trigger()` validation bug in task creation.
- [ ] Add the sixth score factor or intentionally rename/merge factors according to the scoring spec.

---

## [ ] PHASE 4 — END-TO-END POLISH & HARDENING

### Security

- [ ] Remove demo login fallback.
- [ ] Remove localStorage authorization as a trust mechanism.
- [ ] Never expose the service-role key to the browser.
- [ ] Use server-side role checks for mutation routes.
- [ ] Verify ownership for every employee route.
- [ ] Add security headers.
- [ ] Configure CSP appropriate for Supabase and the selected LLM endpoint.
- [ ] Add rate limiting on expensive endpoints.
- [ ] Validate all IDs as UUIDs after production migration.
- [ ] Sanitize CSV output to avoid formula injection.

### Reliability

- [ ] Add transaction retries only where safe.
- [ ] Add idempotency keys for allocation approvals and reallocation approvals.
- [ ] Add LLM timeout and deterministic fallback explanations.
- [ ] Never allow LLM failure to block a database-safe deterministic decision.
- [ ] Add structured server logging.
- [ ] Add health/readiness endpoint.
- [ ] Add cron monitoring.

### Testing

- [ ] Unit tests for every scoring factor.
- [ ] Unit tests for eligibility filters.
- [ ] Unit tests for multi-person allocation.
- [ ] Unit tests for reallocation.
- [ ] Unit tests for skill-gap aggregation.
- [ ] API integration tests.
- [ ] Supabase/RLS authorization tests.
- [ ] E2E test for new task → AI recommendation → allocation.
- [ ] E2E test for employee unavailable → reallocation proposal → manager approval.
- [ ] E2E test for high-priority task → impact/reallocation proposal.
- [ ] E2E test for employee task completion → workload reduction.
- [ ] E2E test for audit trail creation.

### Deployment

- [ ] Configure Vercel project.
- [ ] Configure Supabase production project.
- [ ] Configure environment variables.
- [ ] Configure Vercel Cron for SLA worker.
- [ ] Apply migrations in order.
- [ ] Create real Auth users.
- [ ] Link users to `user_profiles`.
- [ ] Seed production demo data only if needed for presentation.
- [ ] Run production build.
- [ ] Run smoke tests.
- [ ] Verify Realtime.
- [ ] Verify cron.
- [ ] Verify RLS with both roles.
- [ ] Verify LLM key is server-only.

---

# SECTION 4 — CLAUDE OPUS EXECUTION BLUEPRINT

## 4.0 Implementation rules for the coding model

1. Work inside the existing Reflex repository; do not replace the current UI with a new application.
2. Use TypeScript everywhere in the production application layer.
3. Keep the existing UI components and route structure unless a wiring change is required.
4. Do not import anything from `lib/data/mockData.ts` from production pages after Phase 3 is complete.
5. Do not put business logic inside page components.
6. Route handlers validate input and call service methods; repositories contain database access; domain modules contain deterministic decision logic.
7. Never trust a score, role, employee ID, or permission value supplied by the browser.
8. Never let the LLM select employees or mutate the database.
9. Every mutation that changes task allocation state must be transactional and auditable.
10. Every reallocation must be safe under repeat execution.
11. Prefer explicit typed result objects over `any`.
12. Do not add a second backend runtime.

---

# 4.1 Database migration files

## File: `supabase/migrations/0001_core.sql`

### Responsibility

Move the existing corrected core SQL into a versioned migration. This file owns:

- `pgcrypto`
- `btree_gist`
- core tables currently defined in the supplied SQL
- indexes
- basic timestamp trigger
- allocation headcount invariant
- task completion workload adjustment only if retained after the workload recalculation migration
- Realtime publication setup
- baseline RLS enablement

### Required correction

Do not make the migration depend on a manually configured `search_path` outside the file. Keep explicit schema-qualified references and function `search_path` pinning as already documented in the corrected SQL.

### Important change

Do not retain `pg_cron` application orchestration in this migration. PostgreSQL data invariants may remain database functions, but application-level SLA/reallocation orchestration belongs in the Next.js cron endpoint.

---

## File: `supabase/migrations/0002_reflex_identity_and_catalog.sql`

### Add `skills`

```sql
create table skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  check (length(trim(name)) > 0),
  check (name = lower(name))
);
```

Add foreign keys from `employee_skills.skill_name` and `task_skill_requirements.skill_name` to `skills.name` after normalizing all skill names to lowercase.

### Add `user_profiles`

```sql
create table user_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  employee_id uuid unique references employees(id) on delete set null,
  role text not null check (role in ('MANAGER','EMPLOYEE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (role = 'MANAGER' and employee_id is null)
    or
    (role = 'EMPLOYEE' and employee_id is not null)
  )
);
```

### Add employee work mode

```sql
alter table employees
  add column work_mode text not null default 'REMOTE'
  check (work_mode in ('REMOTE','ONSITE','HYBRID'));
```

Do not infer work mode from the free-form `location` string.

---

## File: `supabase/migrations/0003_proposals_and_audit.sql`

### `allocation_proposals`

```sql
create table allocation_proposals (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  event_id uuid references events(id) on delete set null,
  proposal_type text not null check (
    proposal_type in ('INITIAL_ALLOCATION','REALLOCATION','PRIORITY_REALLOCATION')
  ),
  status text not null default 'PENDING' check (
    status in ('PENDING','APPROVED','OVERRIDDEN','REJECTED','EXPIRED','NO_FEASIBLE_MATCH')
  ),
  summary text not null,
  explanation text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users(id) on delete set null,
  decision_note text
);

create index idx_allocation_proposals_status on allocation_proposals(status);
create index idx_allocation_proposals_task on allocation_proposals(task_id);
create index idx_allocation_proposals_event on allocation_proposals(event_id);
```

### `allocation_proposal_items`

```sql
create table allocation_proposal_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references allocation_proposals(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  rank integer not null check (rank > 0),
  score numeric(5,2) not null check (score >= 0 and score <= 100),
  skill_match numeric(5,2) not null check (skill_match between 0 and 100),
  availability numeric(5,2) not null check (availability between 0 and 100),
  workload numeric(5,2) not null check (workload between 0 and 100),
  performance numeric(5,2) not null check (performance between 0 and 100),
  sla_safety numeric(5,2) not null check (sla_safety between 0 and 100),
  location numeric(5,2) not null check (location between 0 and 100),
  reason text not null,
  role_note text,
  source_task_id uuid references tasks(id) on delete set null,
  displaces_allocation_id uuid references allocations(id) on delete set null,
  selected boolean not null default false,
  unique (proposal_id, employee_id)
);

create index idx_proposal_items_proposal on allocation_proposal_items(proposal_id);
create index idx_proposal_items_employee on allocation_proposal_items(employee_id);
```

### Audit correction

Change `allocation_logs.triggered_by` to:

```text
AI | MANAGER
```

and add:

```sql
actor_user_id uuid references auth.users(id) on delete set null
```

`allocations.allocated_by` remains:

```text
AI | MANUAL
```

These are different concepts and should not share a TypeScript union accidentally.

Add `PRIORITY_ESCALATED` to the audit action check constraint.

---

## File: `supabase/migrations/0004_skill_gap_and_settings.sql`

### Extend `skill_gap_events`

Add:

```sql
reviewed_at timestamptz,
reviewed_by uuid references auth.users(id) on delete set null
```

### Add single-row `agent_settings`

```sql
create table agent_settings (
  id boolean primary key default true check (id = true),
  sla_lookahead_hours integer not null default 4 check (sla_lookahead_hours between 1 and 48),
  sla_scan_interval_minutes integer not null default 15 check (sla_scan_interval_minutes between 5 and 60),
  workload_soft_limit numeric(5,2) not null default 85 check (workload_soft_limit between 1 and 100),
  workload_hard_limit numeric(5,2) not null default 100 check (workload_hard_limit between 1 and 100),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into agent_settings default values
on conflict (id) do nothing;
```

This makes the existing settings page real instead of cosmetic.

---

## File: `supabase/migrations/0005_rls.sql`

### Security policy model

Enable RLS on every application table.

Managers may read all workforce/task operational data within the one-department system.

Employees may read only:

- their own `employees` row;
- their own `employee_skills`;
- their own availability;
- tasks for which they have an active/released allocation;
- requirements belonging to their assigned tasks;
- their own allocations;
- events relevant to their own allocations;
- no audit log organization-wide access;
- no skill-gap management access;
- no system settings access.

Managers may mutate through server route handlers. Direct browser writes to core operational tables should not be relied upon; application mutations should execute in trusted server code.

The coding model must test both roles explicitly and must not treat a UI redirect as authorization.

---

# 4.2 Server foundation

## File: `lib/server/env.ts`

### Responsibility

Validate required environment variables once on the server.

Required variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
OPENAI_MODEL
CRON_SECRET
```

The service-role key and LLM key must never be imported into client components.

Export a parsed immutable config object.

---

## File: `lib/supabase/server.ts`

Replace the current implementation with the current cookie-based SSR pattern for Next.js 16:

- `createServerClient` from `@supabase/ssr`;
- use `cookies()` from `next/headers` using the current async API;
- expose only `getAll` and `setAll` cookie operations in the SSR adapter;
- do not use the old `get/set/remove` adapter pattern;
- return a fresh server client per request.

---

## File: `lib/supabase/admin.ts`

Create a server-only service-role client using `SUPABASE_SERVICE_ROLE_KEY`.

Requirements:

- import the server-only guard;
- never import this module from client code;
- disable persisted auth session;
- use this client only inside repositories/services that have already performed application authorization.

---

## File: `proxy.ts`

Implement Supabase SSR token refresh for Next.js 16.

Responsibilities:

1. Create the Supabase SSR client for the request.
2. Refresh/validate the Auth session using the current Supabase SSR guidance.
3. Redirect unauthenticated users away from `/manager/*` and `/employee/*` to `/login`.
4. Preserve the originally requested pathname using a safe query parameter only if desired.
5. Do not trust a role cookie; role is obtained server-side from `user_profiles`.

The current official Next.js 16/Supabase SSR pattern uses `proxy.ts` for session refresh; do not recreate the obsolete pre-Next-16 middleware pattern.

---

# 4.3 Authentication and authorization

## File: `lib/server/auth.ts`

Expose:

```ts
export type AuthContext = {
  authUserId: string;
  role: 'MANAGER' | 'EMPLOYEE';
  employeeId: string | null;
};

export async function requireAuth(): Promise<AuthContext>;
export async function requireManager(): Promise<AuthContext>;
export async function requireEmployee(): Promise<AuthContext>;
```

Behavior:

- read the server Supabase session;
- if no valid user: throw `UnauthorizedError` → HTTP 401;
- query `user_profiles` by `auth_user_id`;
- if no profile: throw `ForbiddenError` → HTTP 403;
- manager can have `employeeId = null`;
- employee must have an employee ID.

Never accept `role`, `employeeId`, `authUserId`, or `actorUserId` from request JSON.

---

# 4.4 Shared API contracts

Create directory:

```text
lib/contracts/
```

Create:

```text
lib/contracts/common.ts
lib/contracts/auth.ts
lib/contracts/tasks.ts
lib/contracts/employees.ts
lib/contracts/allocations.ts
lib/contracts/reallocations.ts
lib/contracts/events.ts
lib/contracts/skill-gaps.ts
lib/contracts/settings.ts
```

Every request body and response object used by route handlers must be defined through Zod schemas here.

### Common error response

```json
{
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task was not found",
    "requestId": "uuid"
  }
}
```

### Standard error codes

```text
UNAUTHENTICATED
FORBIDDEN
VALIDATION_ERROR
NOT_FOUND
CONFLICT
NO_FEASIBLE_ALLOCATION
STALE_PROPOSAL
RATE_LIMITED
INTERNAL_ERROR
```

---

# 4.5 Repository layer

Create:

```text
lib/server/repositories/employees.ts
lib/server/repositories/tasks.ts
lib/server/repositories/allocations.ts
lib/server/repositories/availability.ts
lib/server/repositories/events.ts
lib/server/repositories/proposals.ts
lib/server/repositories/skills.ts
lib/server/repositories/skill-gaps.ts
lib/server/repositories/settings.ts
lib/server/repositories/audit.ts
```

Repository functions should:

- contain database queries only;
- return typed rows;
- never decide role authorization;
- never call the LLM;
- never mutate global React/UI state.

Prefer explicit selects over `select('*')` for stable API contracts.

---

# 4.6 Deterministic decision engine

## File: `lib/server/domain/scoring.ts`

Export:

```ts
export interface ScoringContext {
  task: TaskForAllocation;
  requirements: TaskSkillRequirement[];
  employee: EmployeeForAllocation;
  employeeSkills: EmployeeSkill[];
  availability: EmployeeAvailability[];
  activeAllocations: ActiveAllocationContext[];
  now: Date;
}

export interface ScoreBreakdown {
  skillMatch: number;
  availability: number;
  workload: number;
  performance: number;
  slaSafety: number;
  location: number;
}

export interface CandidateScore {
  employeeId: string;
  eligible: boolean;
  score: number;
  breakdown: ScoreBreakdown;
  rejectionReasons: string[];
}
```

Implement exact formulas from Section 2.4.

Important:

- Normalize skill names before comparison.
- Treat `NICE_TO_HAVE` as optional.
- Hard-reject missing MUST_HAVE.
- Compute projected workload from the requested task effort.
- Keep all calculations deterministic and pure.
- Round only at the API/output boundary; retain raw numeric precision internally where practical.

---

# 4.7 Allocation engine

## File: `lib/server/domain/allocator.ts`

Expose:

```ts
export interface AllocationPlan {
  status: 'READY' | 'NO_FEASIBLE_MATCH';
  selected: CandidateScore[];
  rankedCandidates: CandidateScore[];
  uncoveredRequirements: {
    skill_name: string;
    required_count: number;
    covered_count: number;
  }[];
}

export function buildAllocationPlan(input: AllocationInput): AllocationPlan;
```

Algorithm:

1. Filter active employees.
2. Filter by current/future availability.
3. Filter MUST_HAVE requirements.
4. Calculate score for each remaining candidate.
5. Greedily cover requirement slots as described in the scoring specification.
6. Never select an employee twice.
7. Never produce a projected workload over 100%.
8. Return ranked candidates for UI explanation even when the full plan cannot be satisfied.
9. Return `NO_FEASIBLE_MATCH` when requirements cannot be covered safely.

No database calls belong in this file.

---

# 4.8 Reallocation engine

## File: `lib/server/domain/reallocator.ts`

Expose:

```ts
export interface ReallocationInput {
  event: AppEvent;
  affectedTasks: TaskForAllocation[];
  workforce: WorkforceSnapshot;
}

export interface ReallocationDecision {
  taskId: string;
  currentAllocationIds: string[];
  proposedEmployeeIds: string[];
  displacedAllocationIds: string[];
  status: 'READY' | 'NO_FEASIBLE_MATCH';
  reason: string;
}
```

### PERSON_UNAVAILABLE

1. Find all active allocations for the unavailable employee that overlap the unavailability window.
2. For each affected task, exclude the unavailable employee.
3. Re-score remaining candidates.
4. Build a replacement plan.
5. Create a reallocation proposal.
6. Do not change live allocations until the manager approves.

### PRIORITY_CHANGE / urgent task

When a higher-priority task arrives:

1. Search currently unallocated qualified employees.
2. Search low-workload employees assigned to lower-priority tasks.
3. A candidate may be considered for displacement only if removing them from the source task does not produce a projected SLA risk for that source task.
4. Store `source_task_id` and `displaces_allocation_id` in the proposal item.
5. Present impact in the proposal UI.
6. Do not mutate live assignments until manager approval.

### SLA_RISK

1. Identify at-risk tasks.
2. Re-run candidate scoring with SLA safety weighted normally and hard limits enforced.
3. Produce a proposal only when a materially safer alternative exists.
4. If no safe alternative exists, create a `NO_FEASIBLE_MATCH` proposal and expose it to the manager with the failure reason.

The engine is allowed to produce a recommendation rather than a solution. It must never fabricate a safe allocation where none exists.

---

# 4.9 Proposal service

## File: `lib/server/services/proposal-service.ts`

Responsibilities:

- persist proposals and items;
- attach an event/task;
- persist score breakdowns;
- generate explanation text after deterministic scoring;
- return proposal DTOs;
- enforce proposal expiration/staleness.

### Staleness rule

A proposal becomes stale when any of the following changed after proposal creation:

- task priority;
- task SLA deadline;
- task estimated effort;
- required skills;
- employee availability;
- employee workload;
- active allocation state for the proposal task.

On approval, reload all underlying state and recompute. If the recomputed recommendation materially differs, return `409 STALE_PROPOSAL` instead of applying the old candidate list.

---

# 4.10 LLM explanation service

## File: `lib/server/ai/explainer.ts`

The LLM is an explanation layer only.

Input must contain factual fields already computed by the deterministic engine:

```ts
{
  task: {
    title: string;
    priority: Priority;
    estimatedEffort: number;
    slaDeadline: string;
  };
  candidates: Array<{
    employeeId: string;
    employeeName: string;
    score: number;
    breakdown: ScoreBreakdown;
    selected: boolean;
    rejectionReasons: string[];
  }>;
  selectedEmployeeIds: string[];
  context: 'INITIAL_ALLOCATION' | 'REALLOCATION' | 'PRIORITY_REALLOCATION';
}
```

Expected internal response:

```json
{
  "summary": "string",
  "candidate_reasons": [
    {
      "employee_id": "uuid",
      "reason": "string"
    }
  ],
  "skipped_top_candidate_reason": "string|null",
  "risk_flags": ["string"]
}
```

Validate the output with Zod.

Prompt constraints:

- Never invent employee skills, workload, performance, availability, or deadlines.
- Use only facts supplied in the input.
- Do not change numeric scores.
- Do not nominate an employee not present in the candidate list.
- Do not make the allocation decision.
- Keep explanations concise and operational.

If the LLM call fails, times out, or returns invalid JSON, use deterministic reason templates and continue. LLM failure must never make the safe deterministic decision fail.

---

# 4.11 Skill-gap analyzer

## File: `lib/server/domain/skill-gap.ts`

### Inputs

Use recent history from:

- events;
- allocation proposals with `NO_FEASIBLE_MATCH`;
- proposal items and uncovered requirements;
- allocation logs.

### Detection rules

For each skill, count a shortage when one of these occurs:

1. A MUST_HAVE requirement cannot be covered by any eligible employee.
2. A high/critical task has no candidate above a configurable skill threshold.
3. A reallocation proposal fails specifically because the skill is scarce.
4. A lower-priority task is delayed because every qualified employee is overloaded.

### Upsert result

For every affected skill:

```text
times_failed += new_failure_count
related_events += event IDs not already present
last_occurred = newest source event
recommendation_strength = min(1, times_failed / 5)
suggested_hiring_priority =
  1 if times_failed >= 5
  2 if times_failed >= 3
  3 otherwise
```

Do not let the LLM determine these numeric fields.

The UI may phrase the evidence using an LLM later, but the numbers remain deterministic.

---

# 4.12 Domain mutation services

Create:

```text
lib/server/services/task-service.ts
lib/server/services/employee-service.ts
lib/server/services/availability-service.ts
lib/server/services/allocation-service.ts
lib/server/services/reallocation-service.ts
lib/server/services/event-service.ts
lib/server/services/skill-service.ts
lib/server/services/settings-service.ts
lib/server/services/audit-service.ts
lib/server/services/sla-service.ts
```

### Common rule

Every mutation service must:

1. authorize caller;
2. validate domain input;
3. load current state;
4. check invariants;
5. start transaction / RPC transaction boundary;
6. write primary change;
7. write event and audit records;
8. update workload/derived state;
9. commit;
10. run explanation generation outside the critical DB transaction when possible;
11. return a typed DTO.

Supabase JS does not provide a general multi-statement transaction API identical to an ORM. For critical multi-table atomic mutations, implement PostgreSQL RPC functions in migrations and call them from the service. Use SQL transactions inside those functions.

This is the one place where database functions are preferable to a sequence of independent HTTP-level mutations.

---

# 4.13 Exact API routes

All protected routes use server-side Supabase Auth and role checks.

## `GET /api/me`

**Auth:** authenticated  
**Response 200:**

```json
{
  "user": {
    "authUserId": "uuid",
    "role": "MANAGER",
    "employeeId": null,
    "name": "Alex Rivera",
    "email": "manager@example.com"
  }
}
```

Errors: 401, 403.

---

## `GET /api/employees`

**Auth:** MANAGER  
Query parameters:

```text
search?: string
team?: string
status?: ACTIVE|INACTIVE
workload?: high|normal
skill?: string
```

Response:

```json
{
  "items": [EmployeeDTO],
  "total": 15
}
```

Errors: 401, 403, 422.

---

## `GET /api/employees/:id`

**Auth:** MANAGER or same EMPLOYEE  
Return employee, skills, availability summary, and active allocations.

Errors: 401, 403, 404.

---

## `PATCH /api/employees/:id`

**Auth:** MANAGER, or EMPLOYEE only when `:id` matches own employee ID and only self-editable fields are changed.

Request:

```json
{
  "team": "Backend",
  "location": "Bengaluru, IN (IST)",
  "timezone": "Asia/Kolkata",
  "work_mode": "HYBRID",
  "role_title": "Senior Backend Engineer",
  "seniority": "SENIOR"
}
```

Employees must not be able to change themselves to another role/title or edit workload/performance/status.

Errors: 401, 403, 404, 422.

---

## `GET /api/employees/:id/skills`

**Auth:** MANAGER or same EMPLOYEE  
Response: `EmployeeSkillDTO[]`.

---

## `PUT /api/employees/:id/skills`

**Auth:** MANAGER or same EMPLOYEE  
Request:

```json
{
  "skills": [
    {
      "skill_name": "stripe",
      "proficiency": "ADVANCED"
    }
  ]
}
```

Replace the complete skill set in one server-side transaction.

Errors: 401, 403, 404, 409, 422.

---

## `GET /api/tasks`

**Auth:** MANAGER  
Query parameters:

```text
search?: string
status?: UNASSIGNED|ASSIGNED|IN_PROGRESS|COMPLETED|ON_HOLD
priority?: CRITICAL|HIGH|MEDIUM|LOW
sla?: at-risk|safe
assigned_to?: uuid
```

Response:

```json
{
  "items": [TaskListDTO],
  "total": 12
}
```

---

## `POST /api/tasks/allocation-suggestions`

This is a draft-analysis endpoint used before task creation.

**Auth:** MANAGER

Request:

```json
{
  "title": "Payment webhook latency",
  "description": "...",
  "priority": "HIGH",
  "sla_deadline": "2026-09-19T14:00:00Z",
  "estimated_effort": 6,
  "tags": ["stripe","payments"],
  "required_location": "REMOTE",
  "skill_requirements": [
    {
      "skill_name": "stripe",
      "proficiency": "ADVANCED",
      "people_required": 1,
      "requirement_type": "MUST_HAVE"
    }
  ]
}
```

Response:

```json
{
  "suggestions": [
    {
      "employee": EmployeeDTO,
      "score": 94.25,
      "reason": "string",
      "breakdown": {
        "skillMatch": 100,
        "availability": 100,
        "workload": 70,
        "performance": 98,
        "slaSafety": 100,
        "location": 100
      }
    }
  ],
  "eligible_count": 8,
  "generated_at": "2026-09-18T...Z"
}
```

The client-supplied score is never accepted during task creation.

Errors: 401, 403, 422, 429, 500.

---

## `POST /api/tasks`

**Auth:** MANAGER

Request:

```json
{
  "title": "Payment webhook latency",
  "description": "...",
  "priority": "HIGH",
  "sla_deadline": "2026-09-19T14:00:00Z",
  "estimated_effort": 6,
  "tags": ["stripe","payments"],
  "required_location": "REMOTE",
  "skill_requirements": [
    {
      "skill_name": "stripe",
      "proficiency": "ADVANCED",
      "people_required": 1,
      "requirement_type": "MUST_HAVE"
    }
  ],
  "allocation_mode": "AI",
  "selected_employee_ids": ["uuid"]
}
```

Rules:

- `allocation_mode=AI`: server re-runs scoring and uses the selected IDs only if they are still safe; otherwise return `409 STALE_ALLOCATION_SELECTION` with fresh suggestions.
- `allocation_mode=MANUAL`: selected IDs are manager overrides; still apply eligibility and headcount constraints. Manager may knowingly choose an eligible lower-ranked candidate, but cannot bypass impossible hard constraints without an explicit future override mechanism.
- Create task, requirements, allocation rows, event, and allocation log atomically.

Response 201:

```json
{
  "task": TaskDTO,
  "allocations": [AllocationDTO],
  "event": AppEventDTO,
  "audit_log_ids": ["uuid"]
}
```

Errors: 401, 403, 409, 422, 500.

---

## `GET /api/tasks/:id`

**Auth:** MANAGER or employee allocated to task  
Return:

```text
TaskDTO
requirements
active allocations with employee summary
recent relevant events
recent audit logs (manager only)
```

Errors: 401, 403, 404.

---

## `PATCH /api/tasks/:id`

**Auth:** MANAGER

Request fields:

```json
{
  "title": "string optional",
  "description": "string|null optional",
  "priority": "CRITICAL|HIGH|MEDIUM|LOW optional",
  "sla_deadline": "ISO datetime optional",
  "estimated_effort": 8,
  "tags": ["string"],
  "required_location": "REMOTE|ONSITE|HYBRID"
}
```

Detect priority/SLA/effort changes and emit appropriate events.

Errors: 401, 403, 404, 409, 422.

---

## `PATCH /api/tasks/:id/status`

**Auth:** MANAGER or allocated EMPLOYEE according to allowed transition.

Request:

```json
{
  "status": "IN_PROGRESS"
}
```

Allowed employee transitions:

```text
ASSIGNED → IN_PROGRESS
IN_PROGRESS → COMPLETED
```

Manager can additionally move to `ON_HOLD` and make administrative changes.

On `COMPLETED`:

- release all active allocations;
- recalculate employee workloads;
- write one audit log per release if required by UI, or a transaction-level audit record if the chosen design treats it as a grouped release;
- do not leave active allocations attached to completed tasks.

Errors: 401, 403, 404, 409, 422.

---

## `DELETE /api/tasks/:id`

**Auth:** MANAGER only.

Prevent delete when the task has active allocations unless the service explicitly performs atomic release + delete. Preferred behavior: release allocations, write audit, delete task, all in one database transaction.

Response 204.

Errors: 401, 403, 404, 409.

---

## `POST /api/tasks/:id/priority-escalation`

**Auth:** MANAGER only; system cron may use the internal SLA worker instead.

Use only when a human explicitly escalates a task. Emit `PRIORITY_CHANGE` and `PRIORITY_ESCALATED` audit action.

---

## `GET /api/tasks/:id/allocations`

**Auth:** MANAGER or allocated employee.

Response:

```json
{
  "items": [AllocationWithEmployeeDTO]
}
```

---

## `POST /api/tasks/:id/allocations/release`

**Auth:** MANAGER.

Request:

```json
{
  "allocation_id": "uuid",
  "reason": "Employee no longer available for this task"
}
```

Transaction:

1. lock allocation;
2. verify ACTIVE;
3. mark RELEASED;
4. recalculate employee workload;
5. create `PERSON_UNAVAILABLE` only when caused by actual unavailability; otherwise create appropriate event;
6. create audit log;
7. optionally generate a reallocation proposal.

Response 200 contains the released allocation and any new proposal.

Errors: 401, 403, 404, 409, 422.

---

## `GET /api/reallocations`

**Auth:** MANAGER.

Query:

```text
status?: PENDING|APPROVED|OVERRIDDEN|REJECTED|EXPIRED|NO_FEASIBLE_MATCH
```

Response:

```json
{
  "items": [
    {
      "proposal": AllocationProposalDTO,
      "items": [AllocationProposalItemDTO],
      "current_allocations": [AllocationWithEmployeeDTO],
      "event": AppEventDTO|null,
      "task": TaskDTO
    }
  ]
}
```

---

## `GET /api/reallocations/:proposalId`

**Auth:** MANAGER only.

Return complete proposal, candidate breakdowns, current allocations, and impact information.

---

## `POST /api/reallocations/:proposalId/approve`

**Auth:** MANAGER.

Request:

```json
{
  "decision_note": "Approved after reviewing SLA impact"
}
```

Algorithm:

1. Lock proposal.
2. Verify `PENDING`.
3. Reload task/workforce state.
4. Re-score candidates.
5. Verify the proposal is still valid.
6. Start transaction.
7. Release old allocations to be replaced.
8. Create new ACTIVE allocations.
9. Update task status to `ASSIGNED` or preserve `IN_PROGRESS` as appropriate.
10. Recalculate workload.
11. Update proposal to `APPROVED`.
12. Create allocation logs with before/after state.
13. Commit.

Response 200:

```json
{
  "proposal": AllocationProposalDTO,
  "allocations": [AllocationDTO],
  "audit_log_ids": ["uuid"]
}
```

Errors: 401, 403, 404, 409, 422.

---

## `POST /api/reallocations/:proposalId/override`

**Auth:** MANAGER.

Request:

```json
{
  "employee_ids": ["uuid"],
  "reason": "Prefer backend lead with domain familiarity"
}
```

The server validates the chosen employees against hard constraints and headcount.

Response 200 uses the same shape as approval.

Do not trust client-supplied score/reason fields.

---

## `POST /api/employee/me/availability`

**Auth:** EMPLOYEE.

Request:

```json
{
  "start_date": "2026-09-20",
  "end_date": "2026-09-22",
  "reason": "Annual leave",
  "is_available": false
}
```

Rules:

- dates must satisfy `end_date >= start_date`;
- normalize to employee's date semantics, not browser locale;
- insert availability window;
- identify overlapping active allocations;
- create `PERSON_UNAVAILABLE` event(s);
- generate reallocation proposals after the availability transaction commits.

Response 201 includes the availability row and created proposal IDs.

---

## `GET /api/employee/me/availability`

**Auth:** EMPLOYEE.

Return the employee's availability windows ordered by start date descending.

---

## `DELETE /api/employee/me/availability/:id`

**Auth:** EMPLOYEE owner or MANAGER.

Only delete future/unstarted windows unless a manager explicitly overrides.

Response 204.

---

## `GET /api/employee/me/tasks`

**Auth:** EMPLOYEE.

Return only tasks linked to the authenticated employee through allocations.

This replaces the current `INITIAL_TASKS.slice(0, 4)` behavior.

---

## `PATCH /api/employee/me/tasks/:taskId/status`

**Auth:** EMPLOYEE.

Same allowed employee status transitions as the task status route.

---

## `GET /api/events`

**Auth:** MANAGER.

Query:

```text
type?: PERSON_UNAVAILABLE|NEW_TASK|PRIORITY_CHANGE|SLA_RISK
limit?: number
since?: ISO datetime
```

Response:

```json
{
  "items": [AppEventDTO]
}
```

Do not introduce `SKILL_GAP` into this enum. Skill gaps are a separate read model.

---

## `GET /api/audit`

**Auth:** MANAGER.

Query:

```text
task_id?: uuid
employee_id?: uuid
action?: ALLOCATED|REALLOCATED|RELEASED|PRIORITY_ESCALATED
from?: ISO datetime
to?: ISO datetime
```

Return paginated audit rows with actor and employee summaries.

CSV export may be implemented client-side from the typed API result, but sanitize every value that begins with `=`, `+`, `-`, or `@` before writing CSV cells.

---

## `GET /api/skill-gaps`

**Auth:** MANAGER.

Return `skill_gap_events` ordered by `suggested_hiring_priority ASC`, then `times_failed DESC`.

Do not apply the page's old hard-coded five-failure logic in the client; use server values.

---

## `POST /api/skill-gaps/:skill/review`

**Auth:** MANAGER.

Request:

```json
{}
```

Write `reviewed_at = now()` and `reviewed_by = authenticated user`.

Response 200 returns the updated record.

---

## `GET /api/skills`

**Auth:** MANAGER for management UI; authenticated read if the employee UI needs a shared directory.

Return sorted lowercase skill names.

---

## `POST /api/skills`

**Auth:** MANAGER.

Request:

```json
{
  "name": "kubernetes"
}
```

Normalize with `trim().toLowerCase()`.

Return 201 or 409 if already present.

---

## `DELETE /api/skills/:name`

**Auth:** MANAGER.

Do not allow delete if referenced by employee skills or task requirements unless the operation explicitly performs a safe cascade strategy. Preferred behavior: return 409 explaining dependent records.

---

## `GET /api/settings/agent`

**Auth:** MANAGER.

Return:

```json
{
  "sla_lookahead_hours": 4,
  "sla_scan_interval_minutes": 15,
  "workload_soft_limit": 85,
  "workload_hard_limit": 100
}
```

---

## `PATCH /api/settings/agent`

**Auth:** MANAGER.

Validate ranges and persist through `agent_settings`.

Do not dynamically rewrite Vercel's cron schedule from this endpoint. The scan interval is a configuration value used by application logic; the deployed cron remains at the configured project schedule.

---

# 4.14 SLA/background worker

## File: `app/api/internal/cron/sla/route.ts`

### Method

`GET`.

### Authentication

Require header:

```text
Authorization: Bearer <CRON_SECRET>
```

or the platform's cron secret header if the deployment platform supplies one; validate it server-side.

### Algorithm

1. Load agent settings.
2. Find tasks not completed whose SLA deadline is within the configured lookahead window.
3. For each task whose priority should increase, update the priority and create `SLA_RISK` event + audit record inside one database transaction.
4. After the transaction, invoke the reallocation engine for the resulting event.
5. Persist a proposal when a safer candidate plan exists.
6. Do not create duplicate proposals for the same task/event if an equivalent PENDING proposal already exists.
7. Return a summary count.

Response:

```json
{
  "processed": 4,
  "events_created": 2,
  "proposals_created": 1,
  "no_feasible_match": 1
}
```

---

# 4.15 Typed API client

## File: `lib/api/client.ts`

Create a small fetch wrapper:

```ts
export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { schema?: ZodSchema<T> }
): Promise<T>;
```

Behavior:

- send credentials/cookies automatically;
- parse JSON when applicable;
- map non-2xx responses into a typed `ApiError`;
- parse successful JSON through the supplied Zod schema;
- include `AbortSignal` support.

Do not create a generic "data service" that hides endpoint semantics.

---

# 4.16 React Query hooks

Create:

```text
lib/hooks/useMe.ts
lib/hooks/useEmployees.ts
lib/hooks/useEmployee.ts
lib/hooks/useTasks.ts
lib/hooks/useTask.ts
lib/hooks/useAllocationSuggestions.ts
lib/hooks/useAllocations.ts
lib/hooks/useReallocations.ts
lib/hooks/useAvailability.ts
lib/hooks/useEmployeeTasks.ts
lib/hooks/useEvents.ts
lib/hooks/useAudit.ts
lib/hooks/useSkillGaps.ts
lib/hooks/useSkills.ts
lib/hooks/useAgentSettings.ts
```

Mutation hooks:

```text
useCreateTask
useUpdateTask
useUpdateTaskStatus
useDeleteTask
useReleaseAllocation
useApproveReallocation
useOverrideReallocation
useUpdateEmployee
useUpdateEmployeeSkills
useCreateAvailability
useDeleteAvailability
useUpdateEmployeeTaskStatus
useCreateSkill
useDeleteSkill
useReviewSkillGap
useUpdateAgentSettings
```

### Cache keys

Use stable keys:

```text
['me']
['employees', filters]
['employee', employeeId]
['employee-skills', employeeId]
['employee-availability', employeeId]
['tasks', filters]
['task', taskId]
['task-allocations', taskId]
['reallocations', filters]
['reallocation', proposalId]
['events', filters]
['audit', filters]
['skill-gaps']
['skills']
['agent-settings']
```

### Invalidation

After creating a task:

```text
invalidate tasks
invalidate dashboard queries
invalidate events
invalidate allocations for created task
```

After allocation/reallocation:

```text
invalidate task
invalidate task allocations
invalidate tasks
invalidate employees
invalidate reallocations
invalidate audit
invalidate events
invalidate skill-gaps when a gap was generated
```

After availability:

```text
invalidate employee availability
invalidate employee
invalidate tasks
invalidate reallocations
invalidate events
invalidate employees
```

---

# 4.17 Supabase Realtime frontend

## File: `lib/realtime/useReflexRealtime.ts`

Subscribe to:

- `tasks`
- `allocations`
- `employee_availability`
- `events`

Use table-specific channels or a single channel with clearly registered listeners.

On any INSERT/UPDATE/DELETE:

- invalidate the matching React Query keys;
- never directly mutate a query cache with incomplete database payloads unless the payload shape is fully validated.

The manager shell may mount this hook once.

Employee screens may subscribe only to employee-relevant changes to limit unnecessary refreshes.

---

# 4.18 Exact frontend files to modify

## `app/(auth)/login/page.tsx`

Remove:

- demo fallback authentication;
- localStorage session creation;
- demo role switch based on credentials.

Implement:

1. `supabase.auth.signInWithPassword`.
2. Fetch `/api/me` after successful sign-in.
3. Redirect according to server-returned role.
4. Display Supabase auth errors without leaking provider internals.
5. On sign-out elsewhere, call `supabase.auth.signOut()`.

---

## `lib/auth.ts`

Replace the current demo-session implementation with a client-safe auth state helper only.

Do not store trusted role data in localStorage.

`AuthSession` should be replaced by the API-derived `MeDTO` contract.

---

## `app/manager/layout.tsx`

Remove client-side authorization based on `getStoredSession()`.

Use server-side protection through `proxy.ts` and/or a server `requireManager()` call in a server layout.

If a client shell still requires user context, fetch `useMe()` inside the client shell after authorization.

---

## `app/employee/layout.tsx`

Same approach using `requireEmployee()`.

---

## `components/shell/TopBar.tsx`

Remove the demo role switch.

Load `useMe()`.

Implement real Supabase sign-out.

Search should query live React Query datasets or a dedicated search endpoint rather than `INITIAL_*` arrays.

---

## `components/shell/NotificationBell.tsx`

Replace `INITIAL_EVENTS` with `useEvents()`.

Unread state may remain UI-local, but event content itself must come from the backend.

---

## `app/manager/dashboard/page.tsx`

Replace all `INITIAL_*` references with hooks.

Implement query-parameter filters linked from KPI cards.

Dashboard metrics should be derived from current server data, not hard-coded arrays.

Suggested server queries:

```text
active tasks
at-risk tasks
unassigned tasks
overloaded employees
recent events
skill gaps
```

A dedicated `/api/dashboard/manager` aggregate endpoint may be introduced only if multiple network requests become a measurable performance problem; do not add it prematurely.

---

## `app/manager/tasks/page.tsx`

Use `useTasks(filters)`.

Read:

```text
status
priority
sla
search
```
from `useSearchParams()`.

Status actions must call `useUpdateTaskStatus`.

Delete must call `useDeleteTask` after confirmation.

Do not mutate local copies as the source of truth.

---

## `app/manager/tasks/new/page.tsx`

This is the primary AI-demo screen.

### Fix current validation bug

The current code uses `form.trigger()` without awaiting it. Replace with:

```ts
const isValid = await form.trigger(['title', 'skills']);
if (!isValid) return;
```

### AI suggestions

Replace the current `setTimeout` and hard-coded candidate list with `useAllocationSuggestions`.

The drawer must display the API's six-factor breakdown.

### Final creation

`handleFinalSubmit` calls `useCreateTask()` with form data and selected IDs.

After success:

- invalidate task/dashboard/event caches;
- route to `/manager/tasks/:id` or `/manager/tasks`;
- show the server-generated allocation summary.

Never submit score values from the browser.

---

## `components/drawers/AiSuggestionDrawer.tsx`

Replace payload callbacks with controlled mutation props or query state.

`Accept All` must call the actual create/approval mutation and display server errors.

The drawer must be able to represent:

- no candidates;
- safe candidates;
- no feasible match;
- loading;
- stale suggestion;
- server error.

---

## `components/drawers/ManualPickerDrawer.tsx`

Load employees from `useEmployees()` or from a task-scoped candidate endpoint.

Display current workload, skill compatibility, work mode, and availability.

Selection is local UI state until the parent mutation executes.

---

## `app/manager/tasks/[id]/page.tsx`

Replace `INITIAL_TASKS`, `INITIAL_EMPLOYEES`, `INITIAL_ALLOCATION_LOGS`, and `INITIAL_EVENTS` with `useTask`, `useAllocations`, and related hooks.

Mutation handlers:

- Hold → `useUpdateTaskStatus`.
- Complete → `useUpdateTaskStatus`.
- Delete → `useDeleteTask`.
- Release employee → `useReleaseAllocation`.
- Priority change → `useUpdateTask` or dedicated escalation route.

Do not embed employee names such as `Vikram Malhotra` in the handler logic.

---

## `app/manager/reallocations/page.tsx`

Replace event-only mock rendering with `useReallocations()`.

Approve → `useApproveReallocation`.

Override → `useOverrideReallocation`.

After approval, refresh:

```text
reallocations
current task
allocations
employees
audit
notifications/events
```

The page must show `NO_FEASIBLE_MATCH` explicitly and explain why no safe candidate exists.

---

## `components/drawers/EventDetailDrawer.tsx`

Load actual event/proposal details.

Approve and override buttons must call actual mutation callbacks rather than only displaying toasts.

---

## `app/manager/employees/page.tsx`

Use `useEmployees(filters)`.

Assign-to-task action opens the manual picker with live candidate data.

Do not create allocation directly from the table; use the shared allocation mutation path.

---

## `app/manager/employees/[id]/page.tsx`

Use `useEmployee`, `useEmployeeSkills`, `useEmployeeAvailability`.

Profile and skill edits call server mutations.

Deactivation must call employee update endpoint and must invoke reallocation logic when the employee has active work, or else it must be rejected with 409 and instruct the manager to mark unavailability explicitly.

---

## `app/employee/dashboard/page.tsx`

Use `useMe()` and `useEmployeeTasks()`.

Metrics must be based on actual assigned tasks.

---

## `app/employee/tasks/page.tsx`

Replace `INITIAL_TASKS.slice()` with live assigned tasks.

Start/Done buttons call `useUpdateEmployeeTaskStatus`.

---

## `app/employee/availability/page.tsx`

Replace local `entries` state with `useAvailability()`.

Submit → `useCreateAvailability`.

Delete → `useDeleteAvailability`.

After creation, show the number of affected tasks and pending reallocation proposals returned by the server.

Do not use the current hard-coded default leave records after live integration.

---

## `app/employee/profile/page.tsx`

Use `useMe()` and `useEmployee()`.

Save team/location/timezone/work mode/skills through the real API.

Do not permit changes to workload, performance score, role, or authentication identity.

---

## `app/manager/skill-gaps/page.tsx`

Use `useSkillGaps()`.

Export CSV from server-derived data and sanitize formula-leading values.

Replace "Open Requisition" toast with a visible non-persistent action or remove it from MVP scope. A real hiring/requisition workflow is not represented in the current data model and should not be fabricated.

`Mark Reviewed` should call `POST /api/skill-gaps/:skill/review`.

---

## `app/manager/settings/page.tsx`

Use `useSkills()` and `useAgentSettings()`.

Skill add/delete calls the skills API.

SLA parameters call the settings API.

The page must explain that cron execution frequency is deployment-configured and the saved SLA lookahead is application policy.

---

## `app/manager/audit/page.tsx`

Use `useAudit(filters)`.

Export only server-returned rows.

Do not assume the audit actor union is `AI|MANUAL`; it is `AI|MANAGER`.

---

# 4.19 Mock data migration and seeding

## File: `supabase/seed.sql`

Convert the useful content of `lib/data/mockData.ts` into actual database seed data.

Important:

- seed `skills` first;
- seed employees with UUIDs;
- seed employee skills using the same lower-case names;
- seed tasks;
- seed task requirements;
- seed allocations;
- seed events;
- seed audit logs;
- seed skill gaps;
- create development `user_profiles` only after corresponding Auth users exist, or provide a separate admin seed script for Auth users.

Do not copy browser-generated `new Date()` values into seed data. Use deterministic timestamps for reproducible tests.

After seed conversion, keep `lib/data/mockData.ts` only as a test fixture source or delete it once tests use database fixtures.

---

# 4.20 Testing file plan

Add:

```text
lib/server/domain/__tests__/scoring.test.ts
lib/server/domain/__tests__/allocator.test.ts
lib/server/domain/__tests__/reallocator.test.ts
lib/server/domain/__tests__/skill-gap.test.ts
lib/server/services/__tests__/task-service.test.ts
lib/server/services/__tests__/reallocation-service.test.ts
app/api/__tests__/auth.test.ts
app/api/__tests__/tasks.test.ts
app/api/__tests__/reallocations.test.ts
app/api/__tests__/availability.test.ts
app/api/__tests__/employees.test.ts
e2e/reflex.spec.ts
```

### Mandatory unit cases

1. Missing MUST_HAVE skill → candidate rejected.
2. Below-required proficiency → candidate rejected.
3. Available candidate beats unavailable candidate.
4. High workload candidate loses to safer lower-workload candidate when SLA is otherwise comparable.
5. Best-skilled employee is skipped because projected workload exceeds the hard limit.
6. Critical task with imminent SLA penalizes risky assignments.
7. Required work mode rejects incompatible employee.
8. Two-person requirement returns two distinct employees.
9. Multi-skill requirement returns a set covering all required slots.
10. No feasible candidate returns explicit failure.
11. Reallocation excludes the unavailable employee.
12. Reallocation does not displace a lower-priority task if doing so creates SLA risk.
13. Proposal approval rejects stale data.
14. Duplicate approval is idempotent or returns conflict without double allocation.
15. Employee cannot read another employee's private data.
16. Employee cannot mutate another employee.
17. Manager can read operational data.
18. Unauthenticated requests return 401.
19. Wrong role returns 403.

---

# 4.21 Package/config changes

Update `package.json`.

Required additions for the production blueprint:

```text
eslint
eslint-config-next
vitest
@testing-library/react
@testing-library/jest-dom
playwright
openai   (only if the selected implementation uses the official OpenAI SDK)
```

The current `lint` script uses `next lint`. Replace it with the current ESLint CLI configuration for the installed Next.js major.

Recommended scripts:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test"
}
```

Do not leave `vite.config.js` as an implied application build configuration; Next.js is the real application runtime. Keep it only if the legacy prototype explicitly requires it, otherwise remove it during cleanup.

`legacy_prototype/` should not participate in the production build.

---

# 4.22 Vercel deployment files

## File: `vercel.json`

Use a single cron for the SLA worker:

```json
{
  "crons": [
    {
      "path": "/api/internal/cron/sla",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

The route must still authenticate the invocation.

Do not create an additional pg_cron SLA job that performs the same work, or the system can escalate twice.

---

# 4.23 Environment files

## File: `.env.example`

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=
CRON_SECRET=
```

Never commit `.env.local`.

---

# 4.24 API response DTO normalization

Create `lib/contracts/dtos.ts` and define API-facing DTOs explicitly. Do not return raw Supabase rows everywhere.

At minimum:

```text
EmployeeDTO
EmployeeSkillDTO
AvailabilityDTO
TaskDTO
TaskRequirementDTO
AllocationDTO
AllocationWithEmployeeDTO
EventDTO
AuditLogDTO
SkillGapDTO
SkillDTO
AllocationProposalDTO
AllocationProposalItemDTO
MeDTO
```

Field names should use the existing snake_case database field names only when directly mirroring a database contract is valuable. The frontend's current type names can be kept stable to minimize churn. Do not create one DTO naming convention in half the API and another elsewhere.

Recommended rule: keep domain/database fields in snake_case because the current types already use that convention, and use camelCase only for nested frontend-only presentation fields such as `breakdown.skillMatch`.

---

# 4.25 Important business invariants

Claude Opus must implement these invariants consistently across every mutation path:

### Invariant 1
An ACTIVE allocation requires an ACTIVE employee.

### Invariant 2
An employee cannot have duplicate ACTIVE allocations for the same task.

### Invariant 3
A completed task cannot retain ACTIVE allocations.

### Invariant 4
Workload must equal the workload derived from active task allocations according to the defined effort formula, or the system must have a single documented reason for a temporary divergence.

### Invariant 5
No AI proposal may bypass hard eligibility rules.

### Invariant 6
Every allocation change creates a corresponding audit record.

### Invariant 7
Every dynamic reallocation originates from an event or an explicit manager action.

### Invariant 8
The LLM cannot create new employee IDs, skills, scores, or workload values.

### Invariant 9
A stale proposal cannot be approved against changed workforce state.

### Invariant 10
Employee-facing routes must be scoped to the authenticated employee.

---

# 4.26 Critical issues in the old plan that are explicitly corrected here

## Issue A — Broad RLS read access

The older SQL grants authenticated SELECT broadly across the application tables. That is acceptable for a demo with one trusted user but not for real employee-facing access control.

**Correction:** role-aware RLS plus server authorization.

## Issue B — LocalStorage as authorization

The current frontend stores the role/session locally and redirects client-side.

**Correction:** Supabase Auth session + server-side `user_profiles` lookup + protected server routes.

## Issue C — `events.type` vs `SKILL_GAP`

The frontend includes `SKILL_GAP`, while the database event constraint does not.

**Correction:** remove `SKILL_GAP` from `EventType`; keep skill gaps in `skill_gap_events`.

## Issue D — audit action mismatch

Frontend types currently include `PRIORITY_ESCALATED`, while the database's older constraint does not. The frontend also uses the wrong union for `triggered_by`.

**Correction:** add `PRIORITY_ESCALATED` and change audit actor/trigger semantics to `AI|MANAGER`.

## Issue E — no master skill table

The Settings page behaves as though a skill directory exists, but the DB plan has no `skills` table.

**Correction:** add `skills`.

## Issue F — no durable AI proposal

A volatile AI candidate list is insufficient for reallocation approvals.

**Correction:** add `allocation_proposals` and `allocation_proposal_items`.

## Issue G — location scoring is underspecified

A text location like `London, UK (GMT)` does not tell the engine whether an employee can satisfy `ONSITE` or `HYBRID` requirements.

**Correction:** add `employees.work_mode` and keep geographic location separate.

## Issue H — DB cron vs application agent

Having PostgreSQL cron perform application-level allocation orchestration creates a split-brain architecture.

**Correction:** PostgreSQL maintains data invariants; Vercel Cron invokes application SLA/reallocation services.

## Issue I — workload mutation strategy

Blind incremental workload changes can drift when allocations are retried, released, or replaced.

**Correction:** centralize workload recalculation after every allocation state change, preferably in a transaction/RPC.

---

# 4.27 Definition of “100% complete”

Reflex is complete only when the following live demo path works against Supabase without mock data:

```text
MANAGER LOGIN
   ↓
Manager dashboard loads live employees/tasks/events
   ↓
Create high-priority task
   ↓
Enter required skills + SLA + effort
   ↓
Get AI Suggestions
   ↓
Deterministic engine calculates candidates
   ↓
Scores + explanation appear in existing UI
   ↓
Manager accepts
   ↓
Task + requirements + allocations + event + audit are persisted
   ↓
Employee dashboard immediately reflects assignment
   ↓
Employee marks self unavailable
   ↓
Availability persists
   ↓
PERSON_UNAVAILABLE event is created
   ↓
Reallocation engine creates proposal
   ↓
Manager Reallocation Center updates through Realtime
   ↓
Manager approves
   ↓
Old allocation is released
   ↓
New allocation is created
   ↓
Workloads recalculate
   ↓
Before/after audit record appears
   ↓
Employee dashboard changes immediately
   ↓
Repeated shortages populate Skill Gap Analysis
   ↓
Manager sees evidence-backed hiring recommendation
```

That flow is the acceptance test for the project. Everything else is supporting functionality.

---

# 4.28 Recommended implementation order for Claude Opus

Execute in this order; do not wire pages before their server contracts exist.

```text
1. Versioned Supabase migrations
2. Auth + proxy + user_profiles
3. Server error/auth/env helpers
4. Repositories
5. Shared Zod contracts
6. Deterministic scoring engine
7. Allocator
8. Proposal model/service
9. Allocation transaction/RPCs
10. Reallocation engine
11. Skill-gap analyzer
12. Explanation adapter
13. API route handlers
14. React Query API client
15. Manager pages
16. Employee pages
17. Realtime
18. Cron
19. Tests
20. Security hardening
21. Build/deployment validation
22. Remove mock imports from production code
```

Do not implement features out of sequence when doing so would require inventing placeholder APIs.

---

# 4.29 Final engineering position

The project does not need a UI rewrite. The strongest existing work is the product surface and the database foundation. The next phase should be an integration and domain-logic build.

The final architecture deliberately keeps the intelligence simple and explainable:

```text
                    REFLEX
                      │
             Live workforce state
                      │
                      ▼
             deterministic scoring
                      │
                      ▼
             safe allocation plan
                      │
                      ├──────► human-readable explanation
                      │
                      ▼
                persisted proposal
                      │
                      ▼
                manager decision
                      │
                      ▼
            transactional allocation
                      │
                      ▼
              event + audit trail
                      │
                      ▼
               Realtime frontend
                      │
                      ▼
                 next decision
```

This preserves the original requirement — dynamic reallocation — while making the implementation secure, testable, deterministic, and suitable for a short technical demonstration.
