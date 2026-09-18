<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Reflex backend demo

The Express backend uses a deterministic allocation engine, events, audit logs,
skill-gap analysis, and an SLA scan. It defaults to in-memory persistence. Set
`REFLEX_PERSISTENCE=supabase`, `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`),
and the server-only `SUPABASE_SERVICE_ROLE_KEY` to hydrate from and persist to
Supabase. Publishable/anon keys are never used for privileged writes.

The repository targets the simplified schema in `supabase/seed.sql`:
`users`, `employees`, `employee_skills`, `employee_availability`, `tasks`,
`task_skill_requirements`, `allocations`, `events`, `audit_logs`, `skill_gaps`,
and `agent_settings`. This differs from the master plan's
`allocation_logs` and `skill_gap_events` names/types. Reallocation proposals
have no table in the executed schema, so they are checkpointed in event
payloads. Delete endpoints and the process-local skills catalog are not
synchronized.

`supabase/seed.sql` is an optional, credential-free Postgres/Supabase seed
artifact. It creates the small demo schema when absent and uses deterministic
UUIDs with idempotent upserts. It is not executed by the app or tests; review it
against production migrations before applying it to any project.

View your app in AI Studio: https://ai.studio/apps/e4c2fc90-8ae7-4e22-906c-1adca05c445e

## Run Locally (no Supabase required)

**Prerequisites:**  Node.js


1. Install dependencies: `npm install --legacy-peer-deps`
2. Copy `.env.example` to `.env` (Gemini is optional; deterministic explanations are used without it).
3. Run the app: `npm run dev`
4. Open `http://localhost:3000`. The demo uses the in-memory seeded store; no
   Supabase project, URL, key, migration, or network connection is needed.

`npm run test:supabase:smoke` is a read-only live check. It skips unless
`REFLEX_PERSISTENCE=supabase`, a URL, and the service-role key are configured.

### Three-hour reallocation demo

1. The seeded manager view contains **Kubernetes Ingress Controller Memory Spike
   Mitigation**, with Elena Rostova actively allocated and an SLA deadline
   2.5 hours from server startup. It is visible under **SLA at risk** and in
   **Tasks**.
2. Use the user switcher in the header to select **Elena Rostova** (the
   employee portal), then choose **Report Leave / Unavailability**.
3. Leave the dates at their defaults (today through three days from today),
   keep the reason, and click **Submit Leave Window**. The response banner
   confirms the affected active task and proposal count.
4. Switch back to **Alex Rivera**, open **Reallocations** in the sidebar, and
   select **Pending Approval**. The new unavailability proposal is visible with
   the impacted task, releasing assignee, and replacement candidate.
5. Click **Approve Transfer** (or **Review & Override** to choose a candidate).
   The proposal changes to **APPROVED**, the active allocation is replaced,
   and the audit/event feeds update.

The API is available at `http://localhost:3000/api`. `GET /api/health` reports
the active `dummy` persistence mode. Run `npm run lint` and `npm run build` to
validate the server and frontend bundle. Run `npm run test:backend` for the
backend-only integration flow; it starts an in-memory app and exercises health,
seeded employees/tasks, allocation suggestions, task allocation, unavailability
reallocation approval, SLA scanning, audit history, and skill-gap reporting.
