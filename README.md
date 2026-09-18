# Reflex

**AI workforce decision and resource allocation agent**

Reflex helps managers allocate individual employees to competing tasks, respond
to availability and SLA changes, and understand why a decision was made. The
current repository is a working Vite/React frontend paired with an Express/
TypeScript API and a deterministic workforce engine. Supabase persistence is
available for the current simplified demo schema.

> **Project status:** functional prototype and database foundation. The
> production identity, authorization, migration, and transaction model described
> in [`REFLEX_MASTER_PLAN.md`](REFLEX_MASTER_PLAN.md) is still being implemented.

## What It Does

- Scores candidates using skill match, availability, workload, performance, SLA
  safety, and work mode.
- Applies hard eligibility rules before assigning work.
- Plans multi-person assignments while covering required skills and headcount.
- Generates reallocation proposals when an employee becomes unavailable or a
  task becomes risky.
- Supports manager approval and manual override of proposed transfers.
- Records events, allocation changes, audit history, and skill-gap insights.
- Uses an optional Gemini explanation layer without giving an LLM authority to
  select employees or mutate data.
- Provides separate manager and employee views for the core workflows.

## Architecture

```text
React/Vite UI
    -> Express API routes
        -> repositories and domain services
            -> deterministic scorer, allocator, reallocator, SLA scanner
                -> in-memory store or Supabase adapter
```

The deterministic engine is the source of truth for allocation decisions. AI is
limited to explaining computed facts. The current demo API exposes operational
routes for tasks, employees, availability, reallocations, events, audit logs,
skill gaps, settings, and the internal SLA scan.

## Run Locally

### Prerequisites

- Node.js with npm

### Install and start

```bash
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The default `dummy` mode
uses seeded in-memory data and does not require Supabase, credentials, or a
network connection.

### Environment variables

Create a `.env` file when using Supabase or Gemini. The important settings are:

```dotenv
REFLEX_PERSISTENCE=dummy
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

Set `REFLEX_PERSISTENCE=supabase` with `SUPABASE_URL` and the server-only
`SUPABASE_SERVICE_ROLE_KEY` to hydrate and persist the demo data. Never expose
the service-role key to the browser. `GEMINI_API_KEY` is optional; deterministic
explanations are used when it is absent.

## Reallocation Demo

The seeded data includes **Kubernetes Ingress Controller Memory Spike
Mitigation**, with Elena Rostova allocated and an SLA deadline approximately 2.5
hours after startup.

1. In the header, switch to **Elena Rostova**.
2. Open **Report Leave / Unavailability** and submit the default leave window.
3. Switch back to **Alex Rivera** and open **Reallocations > Pending Approval**.
4. Approve the transfer, or use **Review & Override** to select another
   candidate.
5. Confirm that the allocation, event feed, and audit history have updated.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite frontend and Express API |
| `npm run build` | Build the frontend and bundle the server |
| `npm run start` | Start the production server from `dist/` |
| `npm run lint` | Run the TypeScript compiler without emitting files |
| `npm run test:backend` | Run the offline backend integration flow |
| `npm run test:supabase:smoke` | Run the read-only Supabase smoke check when configured |

The API is available under `http://localhost:3000/api`. Use
`GET /api/health` to inspect service and persistence status.

## Data and Persistence

[`supabase/seed.sql`](supabase/seed.sql) is an optional, credential-free seed
artifact. It creates deterministic demo data for the current simplified schema:

`users`, `employees`, `employee_skills`, `employee_availability`, `tasks`,
`task_skill_requirements`, `allocations`, `events`, `audit_logs`, `skill_gaps`,
and `agent_settings`.

The seed is not applied automatically by the app or tests. Review it before
using it in a real Supabase project. The current adapter does not yet match the
master-plan production model, which adds Supabase Auth and `user_profiles`, a
normalized skills catalog, UUID-based relationships, durable
`allocation_proposals`, role-aware RLS, and versioned migrations.

## Roadmap

The next production steps are tracked in [`REFLEX_MASTER_PLAN.md`](REFLEX_MASTER_PLAN.md):

1. Convert the current SQL into versioned migrations and reconcile the schema.
2. Replace demo user switching with Supabase Auth, server-side sessions, and
   role-aware authorization.
3. Add durable proposal records and transactional mutation boundaries.
4. Replace demo persistence paths with the production repository and service
   layer while preserving the existing UI.
5. Add Realtime updates, security hardening, API contracts, and end-to-end tests.
6. Deploy the application on Vercel with Supabase Postgres/Auth/Realtime.

## Current Limitations

- Demo user switching remains in place; it is not an authentication boundary.
- Authorization and RLS are not yet production-complete.
- Reallocation proposals are checkpointed in event payloads rather than stored
  in dedicated proposal tables.
- Multi-table writes are not yet backed by production transaction functions.
- The simplified seed schema is not a substitute for the planned migrations.

For the detailed implementation checklist and architecture decisions, see
[`REFLEX_MASTER_PLAN.md`](REFLEX_MASTER_PLAN.md) and
[`PROJECT_STATUS_LOG.md`](PROJECT_STATUS_LOG.md).
