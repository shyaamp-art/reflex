# Reflex

**AI workforce decision and resource allocation agent**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)

Live demo: [aresreflex.vercel.app](https://aresreflex.vercel.app)

Reflex helps managers allocate employees to competing tasks, respond to
availability and SLA changes, and understand why a decision was made. It's a
Vite/React frontend paired with an Express/TypeScript API and a deterministic
workforce engine, with Supabase for persistence.


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

## Table of Contents

- [What It Does](#what-it-does)
- [Architecture](#architecture)
- [Decision Model](#decision-model)
- [Repository Layout](#repository-layout)
- [Run Locally](#run-locally)
- [Reallocation Demo](#reallocation-demo)
- [API Surface](#api-surface)
- [Demo Authentication](#demo-authentication)
- [Commands](#commands)
- [Testing](#testing)
- [Data and Persistence](#data-and-persistence)
- [Security](#security)
- [Roadmap](#roadmap)
- [Current Limitations](#current-limitations)

## Architecture

```text
React/Vite UI
    -> Express API routes
        -> repositories and domain services
            -> deterministic scorer, allocator, reallocator, SLA scanner
                -> in-memory store or Supabase adapter
```

The deterministic engine is the source of truth for allocation decisions. AI
is limited to explaining computed facts. The API exposes routes for tasks,
employees, availability, reallocations, events, audit logs, skill gaps,
settings, and the internal SLA scan.

## Decision Model

Reflex separates eligibility from ranking. A candidate is rejected before
final scoring when the employee is inactive, unavailable today, missing a
required skill, projected to exceed 100% workload, or incompatible with the
task's work mode.

Eligible candidates are ranked with this weighted composite score:

| Factor | Weight | Purpose |
| --- | ---: | --- |
| Skill match | 35% | Compare required and available proficiency |
| Availability | 15% | Account for leave and projected completion horizon |
| Workload | 20% | Prefer capacity while enforcing the workload ceiling |
| Performance | 10% | Incorporate the employee performance score |
| SLA safety | 10% | Protect near-term deadlines and delivery capacity |
| Location/work mode | 10% | Match remote, hybrid, and onsite requirements |

For multi-person tasks, the allocator prioritizes unmet required-skill
coverage, then candidate score, while respecting headcount and projected
capacity. The reallocator responds to employee unavailability, priority
changes, and SLA risk. Each decision returns a structured reason and score
breakdown for review.

The optional LLM integration is intentionally narrow: it receives
deterministic facts and produces an explanation. It doesn't allocate,
calculate eligibility, or touch data.

## Repository Layout

```text
.
├── src/
│   ├── App.tsx                 # Application shell and workflow coordination
│   ├── components/             # Shell, modals, and decision drawers
│   ├── lib/api.ts              # Frontend API client
│   ├── pages/                  # Manager and employee views
│   └── types/                  # Shared domain contracts
├── server/
│   ├── app.ts                  # Express application factory
│   ├── http.ts                 # API errors and validation helpers
│   ├── ai/                     # Optional explanation adapter
│   ├── db/                     # Store, repository, and Supabase adapter
│   ├── domain/                 # Scoring, allocation, reallocation, and gaps
│   └── routes/                 # Operational API routes
├── supabase/seed.sql           # Optional simplified-schema demo seed
├── tests/                      # Backend integration and smoke tests
├── server.ts                   # Development and production bootstrap
├── REFLEX_MASTER_PLAN.md       # Target architecture and implementation plan
└── PROJECT_STATUS_LOG.md       # Verified progress and known gaps
```

Routes translate requests, repositories own storage access, and domain
modules compute decisions without depending on React components.

Right now Reflex is a modular monolith, not microservices — a single
Vite/Express process with an optional Supabase backend, using operational
events and reallocation triggers to represent an event-driven flow. Not every
mutation is transactional yet; that work (durable proposal records, RLS,
concurrency controls) is tracked in
[`PROJECT_STATUS_LOG.md`](PROJECT_STATUS_LOG.md).

## Run Locally

### Prerequisites

- Node.js with npm

### Install and start

```bash
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The default `dummy`
mode uses seeded in-memory data and doesn't require Supabase, credentials, or
a network connection.

### Environment variables

Create a `.env` file when using Supabase or Gemini. The important settings
are:

```dotenv
REFLEX_PERSISTENCE=dummy
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

Set `REFLEX_PERSISTENCE=supabase` with `SUPABASE_URL` and the server-only
`SUPABASE_SERVICE_ROLE_KEY` to hydrate and persist the demo data. Never
expose the service-role key to the browser. `GEMINI_API_KEY` is optional;
deterministic explanations are used when it's absent.

## Reallocation Demo

The seeded data includes **Kubernetes Ingress Controller Memory Spike
Mitigation**, with Elena Rostova allocated and an SLA deadline approximately
2.5 hours after startup.

1. In the header, switch to **Elena Rostova**.
2. Open **Report Leave / Unavailability** and submit the default leave window.
3. Switch back to **Alex Rivera** and open **Reallocations > Pending Approval**.
4. Approve the transfer, or use **Review & Override** to select another
   candidate.
5. Confirm that the allocation, event feed, and audit history have updated.

## API Surface

| Route group | Responsibility |
| --- | --- |
| `GET /api/health` | Report service and persistence status |
| `GET /api/me` | Return the active demo session |
| `GET /api/users` | List seeded demo users |
| `POST /api/me/switch-user` | Switch the active demo session |
| `/api/tasks` | List, create, update, delete, allocate, release, and score tasks |
| `/api/employees` | List employees and manage availability workflows |
| `/api/employee` | Employee-facing route alias |
| `/api/reallocations` | Review, approve, and override proposals |
| `/api/events` | Read operational events |
| `/api/audit` | Read allocation and decision history |
| `/api/skill-gaps` | Read skill-gap insights |
| `/api/settings` | Read and update agent settings and skills |
| `/api/internal/cron` | Run the SLA scan endpoint |

This is the current demo contract, not a production authorization boundary.

## Demo Authentication

The UI accepts a username (linked email address or seeded display name) and
password. The Express authentication endpoint verifies the password through
Supabase Auth. Supabase stores only the password hash in `auth.users`; the
application schema never reads or stores raw passwords. Demo Auth users can
be provisioned with:

```bash
npm run seed:demo-auth
```

Default development passwords, unique per demo account:

| Account | Password |
| --- | --- |
| `alex.rivera@reflex.internal` | `ReflexAlex!2026` |
| `vikram.m@reflex.internal` | `ReflexVikram!2026` |
| `elena.r@reflex.internal` | `ReflexElena!2026` |
| `david.c@reflex.internal` | `ReflexDavid!2026` |
| `maya.l@reflex.internal` | `ReflexMaya!2026` |
| `marcus.v@reflex.internal` | `ReflexMarcus!2026` |
| `aisha.m@reflex.internal` | `ReflexAisha!2026` |

Override locally in `.env`:

```env
DEMO_ALEX_PASSWORD=your-local-manager-password
DEMO_ELENA_PASSWORD=your-local-employee-password
```

The script creates or updates the demo accounts through the Supabase Admin
API, confirms their email, and links their Auth UUID to the matching
`public.users` row. These credentials are for local demonstrations only.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite frontend and Express API |
| `npm run build` | Build the frontend and bundle the server |
| `npm run start` | Start the production server from `dist/` |
| `npm run lint` | Run the TypeScript compiler without emitting files |
| `npm run test:backend` | Run the offline backend integration flow |
| `npm run test:supabase:smoke` | Run the read-only Supabase smoke check when configured |
| `npm run seed:demo-auth` | Create or reset development users in Supabase Auth |

The API is available under `http://localhost:3000/api`. Use
`GET /api/health` to inspect service and persistence status.

## Testing

### Backend integration flow

```bash
npm run test:backend
```

Starts the app against the in-memory store and exercises health, seeded
employees and tasks, candidate suggestions, task creation, employee
unavailability, reallocation approval, SLA scanning, audit history, and
skill-gap reporting.

### Supabase smoke check

```bash
npm run test:supabase:smoke
```

A read-only live check. Requires `REFLEX_PERSISTENCE=supabase`, a Supabase
URL, and the server service-role key; otherwise it skips instead of
attempting a remote connection.

## Data and Persistence

[`supabase/seed.sql`](supabase/seed.sql) is an optional, credential-free seed
that creates demo data for the current simplified schema: `users`,
`employees`, `employee_skills`, `employee_availability`, `tasks`,
`task_skill_requirements`, `allocations`, `events`, `audit_logs`,
`skill_gaps`, and `agent_settings`.

The seed isn't applied automatically by the app or tests — review it before
using it in a real Supabase project. The master-plan production model adds
Supabase Auth and `user_profiles`, a normalized skills catalog, UUID-based
relationships, durable `allocation_proposals`, role-aware RLS, and versioned
migrations.

## Security

- The Supabase service-role key is server-only and must never reach the
  browser.
- The deterministic engine, not the LLM, owns allocation eligibility and
  scoring.
- The current user switcher is a demo convenience, not authentication.
- Server-side Supabase Auth sessions, role-aware RLS, employee ownership
  checks, security headers, rate limiting, and production cron
  authentication are roadmap work — this is a local prototype / controlled
  demo, not a hardened production deployment.

## Roadmap

Tracked in detail in [`REFLEX_MASTER_PLAN.md`](REFLEX_MASTER_PLAN.md):

1. Convert the current SQL into versioned migrations and reconcile the schema.
2. Replace demo user switching with Supabase Auth, server-side sessions, and
   role-aware authorization.
3. Add durable proposal records and transactional mutation boundaries.
4. Replace demo persistence paths with the production repository and service
   layer while preserving the existing UI.
5. Add Realtime updates, security hardening, API contracts, and end-to-end
   tests.
6. Deploy the production version on Vercel with Supabase Postgres/Auth/Realtime.

## Current Limitations

- Demo user switching remains in place; it is not an authentication boundary.
- Authorization and RLS are not yet production-complete.
- Reallocation proposals are checkpointed in event payloads rather than
  stored in dedicated proposal tables.
- Multi-table writes are not yet backed by production transaction functions.
- The simplified seed schema is not a substitute for the planned migrations.

For the detailed implementation checklist and architecture decisions, see
[`REFLEX_MASTER_PLAN.md`](REFLEX_MASTER_PLAN.md) and
[`PROJECT_STATUS_LOG.md`](PROJECT_STATUS_LOG.md).
