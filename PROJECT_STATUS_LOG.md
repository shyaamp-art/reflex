# Reflex Project Status Log

**Last updated:** 2026-09-19  
**Project:** Reflex — AI Workforce Decision & Resource Allocation Agent  
**Current backend mode:** Supabase-connected simplified schema  

### Manager-console 403 fix (`Manager role is required` on AI suggestions)

Symptom (screenshot): signed-in-looking manager console, but the AI Recommendation drawer
failed with `Manager role is required for this operation.`
Reproduced in Supabase mode: any request without a valid session cookie fell back to
`store.users[0]`, which is a random employee (David Chen) because Supabase returns rows in
arbitrary order — so the suggestions POST 403'd while React kept showing the cached
manager screen (data-load failures only `console.error`, never revalidate the session).

- [x] `server/app.ts`: session fallback is now deterministic — valid cookie session, else the manager account, else `users[0]`. Cookieless demo/test behavior is identical in dummy and Supabase modes; valid employee sessions are still restricted (403 on manager routes).
- [x] `src/App.tsx`: all manager mutation error paths now revalidate the session (`GET /api/me`) on 401/403 before alerting, so a lost/employee cookie drops back to the correct portal/login instead of stranding a stale manager console.
- [x] Verified: `npm run lint`, `npm run test:backend`, `npm run build`, plus Supabase-mode auth probe (no-cookie → manager 200, manager cookie → 200, employee cookie → 403 on manager routes).
- [ ] Follow-up (pre-existing, Phase 4): background Supabase writes fail RLS (`row-level security policy` on `users`/`events`/`allocations`/`agent_settings`), so mutations may not survive restarts until RLS policies land. In-memory flows are unaffected.

## Requested change log — 2026-09-19

### Reassignment reliability fix

Root cause (verified against the live Supabase data): Vikram Malhotra's leave generated
two `NO_FEASIBLE_MATCH` proposals (Stripe backup Maya Lin projected at 110–120% workload;
all other engineers missing Stripe; Marcus Vance on a now-deleted leave window). Those
proposals could never be approved (no selected candidates) nor overridden (status gate +
generic `Override includes an ineligible employee` error), while the UI still enabled
**Approve** and listed every engineer as override-eligible — so every click failed and the
flow looked completely broken. Stale proposals were also never recomputed.

- [x] Refresh open (`PENDING`/`NO_FEASIBLE_MATCH`) proposals in place on every new leave, release, or SLA trigger instead of stacking duplicates or serving stale candidates. Decided proposals are never touched.
- [x] Allow manager override on `NO_FEASIBLE_MATCH` proposals with strict live eligibility revalidation, so freeing capacity (completing/releasing a task) unblocks the transfer without a new trigger event.
- [x] Override errors now name each ineligible employee with exact rejection reasons (skill, workload, availability, work mode); duplicate employee IDs return `409`.
- [x] Approve/override retain already-active holders instead of releasing and recreating every allocation (verified: healthy holder's allocation id preserved on multi-person approval).
- [x] Proposal scoring now uses real store allocations for SLA safety (raw tasks carry no embedded allocations, so the old derivation was always empty) plus the configured SLA lookahead.
- [x] `uncoveredSkills`/skill gaps only track `MUST_HAVE` shortfalls; `NICE_TO_HAVE` gaps no longer dead-end proposals or pollute hiring signals (`uncoveredRequirements` now carries `requirement_type`).
- [x] Review modal: **Approve** disabled unless the proposal is `PENDING` with recommended candidates (with a plain-language explanation), full ranked candidate list with rejection reasons, and the override dropdown disables ineligible engineers with their exact cause.
- [x] Reallocations hub no longer presents a rejected candidate as the transfer target for no-match proposals.
- [x] Added missing Marcus Vance / Aisha Morales demo users to the dummy-mode seed (all six employees can now sign in offline).
- [x] Verified: `npm run lint`, `npm run test:backend`, `npm run build`, plus HTTP end-to-end (leave → proposal → approve/override → release, auth guards) and a saturated-workload scenario (no-match → detailed errors → free capacity → override recovery).

Live-data note: the two existing `NO_FEASIBLE_MATCH` proposals for `task-1` and the
`distributed systems` task are genuinely infeasible under current workloads (Maya Lin at
80% cannot absorb 12–16h more). With this fix the UI now says exactly that and offers the
working path: complete/release one of Maya's other tasks (or wait out leave), then approve
the refreshed proposal or override directly.

### Follow-up implementation log

- [x] Fixed manual assignment eligibility to recognize both `ACTIVE` and live-database `AVAILABLE` employee statuses, while preserving leave, workload, location, and required-skill hard constraints. Manual allocation errors now include the exact rejection reason.
- [x] Confirmed the reported Python Advanced case: Marcus Vance has Python Advanced, but the live database also marks him unavailable from 2026-09-18 through 2026-09-21. Manual selection now visibly disables employees with an unavailable window instead of implying the skill is the problem.
- [x] Removed manual allocation from new task creation. New tasks now go through AI candidate suggestions; manager reallocation review/override remains available for exception handling.
- [x] Added an optional Python optimization sidecar under `optimizer/` implementing `all-MiniLM-L6-v2` cosine similarity, normalized weighted ranking, SciPy Hungarian assignment, and frequency/rarity skill-gap recommendations. The existing TypeScript engine remains the default to prevent runtime crashes when Python dependencies or the model are unavailable.
- [x] Integrated the optimizer into the TypeScript allocator: task suggestions and reallocation proposals use Python scores and Hungarian selections when available; unaffected task allocations remain untouched by the existing impact-scoped event flow; skill-gap updates use Python rarity/frequency recommendations.
- [x] Added process isolation, a 30-second timeout, JSON validation, and automatic TypeScript fallback for missing Python, missing model packages, model errors, or optimizer timeouts.
- [x] Standardized profile images to two role-based avatars: one shared manager profile image and one shared employee profile image. Supabase hydration also normalizes existing database rows to these two images.
- [x] Fixed employee login navigation so a successful employee authentication opens `my-dashboard` instead of leaving the manager-only `dashboard` tab selected.
- [x] Replaced workspace selection login with username/password login. The API resolves the username to the linked user email and verifies the password through Supabase Auth, where only the hash is stored.
- [x] Corrected role middleware registration so manager and employee guards are installed once during app creation rather than during response completion.
- [x] Ensured employee leave always emits a `PERSON_UNAVAILABLE` event, including when the employee has no active task; affected tasks still create reallocation proposals and skill-gap updates.
- [x] Returned triggered leave events from the availability API so the employee workflow can confirm the event chain.
- [x] Removed the in-app demo persona switcher from the authenticated header; changing roles now requires signing in with the corresponding credentials.
- [x] Completed the remaining prototype-level identity/event wiring. Production JWT session validation, RLS, and transactional migrations remain the next production tasks.

- [x] Added a username/password login page for manager and employee accounts backed by Supabase Auth.
- [x] Added AI-suggestion and manual-assignment modes to task creation. Manual mode searches employees by name/role, supports clickable names, shows a profile window, and sends selected employee IDs to the backend.
- [x] Renamed the manager navigation label from “Engineering Pool” to “Employees”.
- [x] Added prototype API role guards for manager mutations and employee self-service routes, plus role-aware rendering for manager screens.
- [x] Removed all user-facing and plan text containing the former legacy identifier.
- [x] Expanded `REFLEX_MASTER_PLAN.md` with the current Express, repository, Supabase adapter, schema, route, and production database responsibilities.
- [x] Added `supabase/reflex_schema.sql`, a fresh-database schema and deterministic sample-data artifact compatible with the current Express adapter.
- [x] Added development-only Supabase Auth provisioning through `npm run seed:demo-auth`; passwords are managed and hashed by Supabase Auth rather than stored in `public.users`.
- [x] Added unique per-user demo passwords with optional local overrides through `DEMO_ALEX_PASSWORD`, `DEMO_VIKRAM_PASSWORD`, `DEMO_ELENA_PASSWORD`, `DEMO_DAVID_PASSWORD`, `DEMO_MAYA_PASSWORD`, `DEMO_MARCUS_PASSWORD`, and `DEMO_AISHA_PASSWORD`.
- [x] Retained manager/employee override variables for local testing while keeping Supabase Auth responsible for password hashing.
- [x] Re-provisioned the seven demo Auth accounts with unique passwords and linked their Auth UUIDs to the matching `public.users` records.
- [x] Ordered Supabase persistence writes so parent rows are written before task requirements, allocations, and audit rows, preventing foreign-key races.
- [x] Verified live Supabase health, task reads, direct writes, and the read-only smoke test with `mode: "supabase"` and `connected: true`.

The remaining production work is still tracked in the ordered plan below, especially
Supabase Auth/session validation, `user_profiles`, RLS, migrations, durable
proposal tables, transactional writes, and live verification.


## Current status

The Reflex frontend and Express backend run locally. The backend is connected to the configured Supabase project and successfully reads the seeded operational data. The deterministic allocation, reallocation, SLA, audit, and skill-gap logic is implemented and tested offline.

The current Supabase adapter targets the simplified schema that was executed in the Supabase SQL Editor. The new `supabase/reflex_schema.sql` documents a compatible expansion path and includes proposal/catalog tables, but it is not yet the complete production schema described in the Reflex master plan. Supabase Auth accounts are provisioned, while frontend password login, server-side session validation, authorization, and production-grade transactional writes remain to be completed.

## Completed work

### Project and backend foundation

- Extracted and organized the Reflex Vite/React/Express project.
- Added the Express API application factory in `server/app.ts`.
- Preserved Vite development middleware and production static serving.
- Added typed domain models for employees, skills, availability, tasks, allocations, events, proposals, audit logs, skill gaps, settings, and users.
- Added API routes for:
  - health and current user
  - tasks and allocation suggestions
  - employees and availability
  - reallocations
  - events
  - audit history
  - skill gaps
  - settings
  - SLA cron scanning

### Deterministic workforce engine

- Implemented candidate scoring using:
  - skill match
  - availability
  - workload
  - performance
  - SLA safety
  - location/work mode
- Implemented deterministic allocation planning.
- Enforced hard constraints for required skills and workload.
- Added deterministic tie-breaking.
- Added multi-person task headcount and requirement coverage handling.
- Implemented reallocation proposal generation for employee unavailability, priority changes, and SLA risk.
- Added stale proposal and duplicate allocation protections.
- Added manager approval and override flows.
- Added workload recalculation after allocation and release.

### Seeded demo data

The in-memory store includes:

- 6 employees
- employee skills
- employee availability windows
- 4 sample tasks
- active allocations
- a task with an approximately 2.5-hour SLA window at seed time
- events
- audit history
- skill-gap records
- agent settings
- manager and employee demo sessions

### Supabase integration

- Added Supabase client dependency.
- Added environment-based persistence selection:
  - `REFLEX_PERSISTENCE=dummy`
  - `REFLEX_PERSISTENCE=supabase`
- Added server-side Supabase connector using `SUPABASE_SERVICE_ROLE_KEY`.
- Added support for:
  - `SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_PUBLISHABLE_KEY`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Fixed startup ordering so `.env` loads before Supabase configuration is initialized.
- Added Supabase hydration for:
  - users
  - employees
  - employee skills
  - availability
  - tasks
  - task requirements
  - allocations
  - events
  - audit logs
  - skill gaps
  - agent settings
- Added persistence writes for the same operational data.
- Changed persistence ordering in `server/db/repository.ts` so foreign-key parents are persisted before dependent rows. This prevents allocations from racing ahead of their tasks during response-finish persistence.
- Confirmed live Supabase reads for `users`, `employees`, and `tasks`.
- Confirmed live API health reports:

```json
{
  "connected": true,
  "mode": "supabase"
}
```

### Database seed/schema artifacts

- Added `supabase/seed.sql`.
- Added `supabase/reflex_schema.sql` with the current adapter-compatible schema, development RLS policies, safe timestamp triggers, proposal tables, skills catalog, and deterministic sample data.
- Deliberately kept readable text IDs such as `emp-1` and `task-1` in the compatibility schema; UUID migration remains a production migration task.
- Deliberately omitted workload triggers so application workload recalculation remains the single current source of truth.
- The executed SQL creates these simplified tables:
  - `users`
  - `employees`
  - `employee_skills`
  - `employee_availability`
  - `tasks`
  - `task_skill_requirements`
  - `allocations`
  - `events`
  - `audit_logs`
  - `skill_gaps`
  - `agent_settings`
- The seed uses deterministic sample IDs and idempotent upserts.
- The SQL was not executed by the application.

### Demo authentication

- Added `scripts/seed-demo-auth.ts`.
- Added the `npm run seed:demo-auth` command.
- The script creates or updates demo users through the Supabase Admin API, confirms their email, updates the matching `public.users` row, and never stores raw passwords in the application schema.
- Default local demo password: `ReflexDemo!2026`.
- The current `LoginPage` remains a prototype user selector; it has not yet been replaced with `supabase.auth.signInWithPassword()`.

### Validation completed

The following checks pass:

```text
npm run lint
npm run test:backend
npm run build
npm run test:supabase:smoke
npm run seed:demo-auth
```

The backend integration test covers:

- health response
- seeded employees, skills, and availability
- seeded tasks and allocations
- allocation suggestions
- task creation and allocation
- employee unavailability
- pending reallocation proposal creation
- proposal approval and replacement allocation
- SLA scanning
- audit history
- skill-gap reporting

## Current limitations

### Database schema mismatch

The current adapter targets the simplified schema, not the final master-plan schema:

| Current schema | Master-plan target |
|---|---|
| `audit_logs` | `allocation_logs` |
| `skill_gaps` | `skill_gap_events` |
| custom `users` table | Supabase Auth plus `user_profiles` |
| event payload proposal checkpoint | `allocation_proposals` and `allocation_proposal_items` |
| text IDs such as `emp-1` | UUID-based production relationships |

Do not apply a different production schema over the current tables until the backend adapter and migration are updated together.

### Security and identity

- Demo user switching is still present.
- Server-side Supabase Auth session validation is not complete.
- Manager and employee authorization is not fully enforced on every route.
- RLS policies have not been implemented and tested against both roles.
- The service-role key currently powers backend access and must never be exposed to the browser.

### Transactional integrity

- Multi-table mutations currently use repository writes rather than PostgreSQL transactional RPC functions.
- Reallocation proposals are not yet first-class database rows.
- Delete and skill-catalog synchronization remain process-local or incomplete.
- Live write tests have not yet been run through the complete reallocation lifecycle.

### Operations

- SLA cron scheduling is implemented as an API route but is not yet deployed on a secure scheduler.
- `CRON_SECRET` enforcement and deployment scheduling must be completed.
- The seeded `task-2` SLA deadline can become expired after the seed is run; reset it for demonstrations when needed.

## Remaining work — ordered plan

### Phase 1 — Finish live operational verification

- [ ] Run `npm run test:supabase:smoke` with the configured `.env`.
- [ ] Verify `GET /api/health` reports `mode: "supabase"` and `connected: true`.
- [ ] Create a temporary task through the API.
- [ ] Confirm the task is written to Supabase.
- [ ] Test live AI allocation and manual allocation.
- [ ] Test live employee availability change.
- [ ] Confirm a pending reallocation proposal is created.
- [ ] Approve the proposal and verify replacement allocation.
- [ ] Confirm allocation release, workload updates, events, and audit records.
- [ ] Remove or mark temporary test data after verification.

### Phase 2 — Production identity and authorization

- [ ] Create real manager and employee accounts in Supabase Auth.
- [ ] Add `user_profiles` linked to `auth.users`.
- [ ] Replace the demo user switcher with authenticated sessions.
- [ ] Implement server-side `requireAuth`, `requireManager`, and `requireEmployee`.
- [ ] Derive actor identity from the authenticated session, never from request JSON.
- [ ] Enforce employee self-access restrictions.
- [ ] Enforce manager-only operational mutations.

### Phase 3 — Final master-plan schema

- [ ] Create versioned Supabase migrations.
- [ ] Add normalized `skills` catalog.
- [ ] Add `user_profiles`.
- [ ] Add UUID-based production relationships.
- [ ] Add `allocation_proposals`.
- [ ] Add `allocation_proposal_items`.
- [ ] Migrate `audit_logs` to `allocation_logs`.
- [ ] Migrate `skill_gaps` to `skill_gap_events`.
- [ ] Add master-plan constraints, indexes, and timestamp triggers.
- [ ] Add workload and allocation invariants.
- [ ] Add Realtime publication configuration.
- [ ] Migrate sample data into the final schema.
- [ ] Update the repository adapter to the final schema.

### Phase 4 — Security and transactions

- [ ] Enable RLS on every application table.
- [ ] Add and test manager policies.
- [ ] Add and test employee self-access policies.
- [ ] Keep direct browser writes disabled for core operational tables.
- [ ] Add PostgreSQL RPC functions for atomic allocation/reallocation mutations.
- [ ] Recompute stale proposals before approval.
- [ ] Add conflict responses for stale or invalid proposals.

### Phase 5 — API and product hardening

- [ ] Replace broad row reads with explicit repository selects.
- [ ] Complete request/response validation for every route.
- [ ] Standardize API error responses and request IDs.
- [ ] Add pagination and filtering limits.
- [ ] Add rate limiting to mutation and suggestion endpoints.
- [ ] Add structured server logging without secrets.
- [ ] Add retry/error handling for Supabase outages.
- [ ] Add durable skill catalog mutations.
- [ ] Complete delete behavior and cascading policy decisions.

### Phase 6 — Scheduled operations and deployment

- [ ] Configure a secure scheduler to call the SLA endpoint.
- [ ] Require and validate `CRON_SECRET`.
- [ ] Configure Supabase Auth redirect URLs.
- [ ] Configure production CORS and allowed origins.
- [ ] Store all secrets in deployment secret storage.
- [ ] Deploy the backend and frontend.
- [ ] Run smoke tests against the deployed environment.
- [ ] Add monitoring for failed cron scans, Supabase errors, and failed reallocations.

## Important environment rules

Use a local `.env` beside `package.json`:

```env
REFLEX_PERSISTENCE=supabase
SUPABASE_URL=https://aksvbvovfdjtdhjdrkih.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<server-only-secret-key>
SUPABASE_JWKS_URL=https://aksvbvovfdjtdhjdrkih.supabase.co/auth/v1/.well-known/jwks.json
CRON_SECRET=<random-secret>
```

Never commit `.env`, expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend, or paste secret values into chat, screenshots, logs, or source files.

## Useful commands

```powershell
cd "C:\Users\shyaa\.copilot\chats\2026-09-19\psychic-tribble-506bede7\reflex"

npm run dev
npm run lint
npm run test:backend
npm run test:supabase:smoke
npm run build
```
