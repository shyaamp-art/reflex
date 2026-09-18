# Reflex

**AI workforce decision and resource allocation agent**

![TypeScript](https://img.shields.io/badge/TypeScript-7.x-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-optional-3FCF8E?logo=supabase&logoColor=white)

> These badges identify technologies declared by the repository. They are not
> claims about coverage, security certification, or production readiness.

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

## Table of Contents

- [What It Does](#what-it-does)
- [Architecture](#architecture)
- [Decision Model](#decision-model)
- [Repository Layout](#repository-layout)
- [Run Locally](#run-locally)
- [Reallocation Demo](#reallocation-demo)
- [API Surface](#api-surface)
- [Commands](#commands)
- [Testing](#testing)
- [Performance Benchmarks](#performance-benchmarks)
- [Data and Persistence](#data-and-persistence)
- [Security and Trust Boundaries](#security-and-trust-boundaries)
- [Production Readiness](#production-readiness)
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

The deterministic engine is the source of truth for allocation decisions. AI is
limited to explaining computed facts. The current demo API exposes operational
routes for tasks, employees, availability, reallocations, events, audit logs,
skill gaps, settings, and the internal SLA scan.

## Decision Model

Reflex separates eligibility from ranking. A candidate is rejected before final
scoring when the employee is inactive, unavailable today, missing a required
skill, projected to exceed 100% workload, or incompatible with the task's work
mode.

Eligible candidates are ranked with this weighted composite score:

| Factor | Weight | Purpose |
| --- | ---: | --- |
| Skill match | 35% | Compare required and available proficiency |
| Availability | 15% | Account for leave and projected completion horizon |
| Workload | 20% | Prefer capacity while enforcing the workload ceiling |
| Performance | 10% | Incorporate the employee performance score |
| SLA safety | 10% | Protect near-term deadlines and delivery capacity |
| Location/work mode | 10% | Match remote, hybrid, and onsite requirements |

For multi-person tasks, the allocator prioritizes unmet required-skill coverage,
then candidate score, while respecting headcount and projected capacity. The
reallocator responds to employee unavailability, priority changes, and SLA risk.
Each decision returns a structured reason and score breakdown for review.

The optional LLM integration is intentionally narrow: it receives deterministic
facts and produces an explanation. It is not the allocator, does not calculate
eligibility, and must not be treated as an authorization or mutation layer.

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

Routes translate requests, repositories own storage access, and domain modules
compute decisions without depending on React components.

### Enterprise Architecture Position

Reflex currently uses a modular monolith rather than horizontally scalable
microservices. Its event-driven architecture is represented by operational
events and reallocation triggers, while the current deployment remains a
single Vite/Express process with an optional Supabase backend.

The codebase is increasingly type-safe at its API and domain boundaries, but
not every data mutation is yet type-safe and idempotent. Transactional mutation
boundaries, durable proposal records, and production concurrency controls are
explicit master-plan work. The repository therefore makes no claim of zero
technical debt; its known gaps are recorded in
[`PROJECT_STATUS_LOG.md`](PROJECT_STATUS_LOG.md).

### Mission-Critical Security Position

The production target includes enterprise-grade security controls, but the
current prototype is not SOC2 compliance ready. Supabase transport and provider
security should not be confused with end-to-end encryption of the complete
application workflow. Automated vulnerability scanning, threat modeling, RLS
verification, secure session handling, and deployment hardening remain required
before a mission-critical security claim would be appropriate.

### CI/CD and Testing Position

The repository currently provides local TypeScript validation, a backend
integration flow, a Supabase smoke check, and a production bundle command. It
does not yet contain fully automated CI/CD pipelines, 100% deterministic test
coverage, or mutation testing. These are quality-system goals tracked by the
master plan, not current badges or guarantees.

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

## API Surface

The current Express application mounts these route groups:

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

This is the current demo contract. The demo session model is not a production
authorization boundary.

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

## Testing

### Backend integration flow

```bash
npm run test:backend
```

This starts the application against the in-memory store and exercises health,
seeded employees and tasks, candidate suggestions, task creation, employee
unavailability, reallocation approval, SLA scanning, audit history, and
skill-gap reporting.

### Supabase smoke check

```bash
npm run test:supabase:smoke
```

This is a read-only live check. It requires `REFLEX_PERSISTENCE=supabase`, a
Supabase URL, and the server service-role key; otherwise it skips rather than
attempting a remote connection.

The current suite is not a claim of 100% test coverage, mutation-testing
coverage, or complete end-to-end coverage. The master plan tracks the remaining
unit, API, RLS, and browser workflow tests.

## Performance Benchmarks

No reproducible load-test results are committed to this repository. The table
below records the current evidence level instead of inventing benchmark values.

| Area | Current implementation | Evidence status |
| --- | --- | --- |
| Candidate scoring | In-process TypeScript calculation over supplied employees and tasks | Functional tests; no published latency distribution |
| Multi-person allocation | Deterministic greedy coverage selection | Functional tests; no large-workforce benchmark |
| Persistence | In-memory store or Supabase network calls | Environment- and dataset-dependent |
| API latency | Express request handling plus domain and persistence work | Not measured in a controlled benchmark |
| Concurrency behavior | Basic duplicate/stale checks in the demo store | Production transaction and contention testing pending |

Big-O characteristics depend on employees, active tasks, skill requirements, and
availability windows. They should be established with a versioned benchmark
harness before making claims such as O(1) behavior, sub-millisecond latency, or
a specific memory reduction.

## Security and Trust Boundaries

- The Supabase service-role key is server-only and must never be sent to the
  browser.
- The deterministic engine, not the LLM, owns allocation eligibility and
  scoring.
- The current user switcher is a demo convenience, not authentication.
- Server-side Supabase Auth sessions, role-aware RLS, employee ownership checks,
  security headers, rate limiting, and production cron authentication remain
  roadmap work.
- The current repository must not be described as enterprise-grade security,
  SOC2 compliance ready, end-to-end encrypted, or vulnerability-free without
  independent implementation and verification.

The master plan defines the intended production security model and deployment
boundary. Until those controls are implemented and tested, treat this as a
local prototype or controlled demonstration.

## Production Readiness

| Capability | Current state | Production target |
| --- | --- | --- |
| UI workflows | Manager and employee demos implemented | Preserve and connect to authenticated live data |
| Deterministic scoring | Implemented and tested offline | Add exhaustive unit and property tests |
| Reallocation | Implemented in demo services | Persist proposals and make approvals transactional |
| Persistence | Simplified Supabase adapter available | Versioned migrations and normalized schema |
| Identity | Demo sessions and user switching | Supabase Auth with server-side role checks |
| Authorization | Incomplete | RLS plus route-level authorization |
| Auditability | Events and audit records | Actor identity, immutable history, and transaction linkage |
| Realtime | Not wired into the UI | Supabase Realtime with query invalidation |
| Operations | Local API cron endpoint | Authenticated scheduler and monitoring |
| Delivery | Local Vite/Express build | Vercel and Supabase deployment with smoke checks |
