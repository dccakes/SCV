## Why

The dashboard shows placeholder UI for tasks and milestones (`src/components/dashboard/planning-overview.tsx` lines 275–290 and 405–468) that implies functionality which does not exist — comments say "Task tracking coming soon" and the `CountdownHero` planning bar is hardcoded to `67%`. There is no `Task` or `Milestone` model in `prisma/schema.prisma`, and Etta's timeline tools (`src/lib/etta/tools/timeline.ts`) are stubs that return a hardcoded list. Couples need (1) a real sense of progress toward the wedding day, and (2) actionable guidance on what to do next.

After researching The Knot, Zola, Hitched.co.uk, and Joy, all competitors ship a flat, generic checklist with no separate milestone concept and no derivation from system state. OSWP can do better: model both tasks (work) and milestones (goals), derive milestones from existing domain state (Vendors, Events, Invitations) where possible, and allow manual override on every entity. Tone differentiates from competitor "exhaustive" feel — lean (~50–60 tasks), explicit categories, calm.

## What Changes

- Introduce `Task` and `Milestone` Prisma models with `TaskCategory` and `MilestoneCategory` enums; relations to `Wedding`, `Event`, optional `Vendor`.
- Seed 13 default milestones and 58 default tasks at wedding creation, scoped to the wedding's primary event by default. Seed lives as code (no `TaskTemplate` model in V1).
- Milestone status is **derived** from existing domain state where possible (Vendor selection, Invitation RSVPs, Event date) and **always overrideable** via a persisted attestation layer (`userOverrideStatus`: `attested` / `dismissed` / null). Effective status = override ?? derived.
- Task `completed` boolean is the simple source of truth; tasks and milestones are independent (no auto-cascade).
- Replace placeholder `TasksCard` and `MilestonesCard` on the dashboard with real data; fix `CountdownHero` planning bar to compute `completedMilestones / totalMilestones`.
- Add new `/checklist` route — combined deep view with horizontal milestone timeline and time-bucketed task list, filterable by category / event / status.
- Replace Etta's stub `get_milestones` / `complete_milestone` tools with real implementations; add `get_tasks` / `complete_task` / `add_task` tools; add `write:tasks` to `ETTA_DEFAULT_PERMISSIONS`.

## Capabilities

### New Capabilities
- `tasks`: User-managed checklist entities scoped to a wedding and tied to an event. Templated default seed at wedding creation; CRUD; completion toggle; filters by category, event, and status; priority queue (overdue + this-week + next-up).
- `milestones`: Progress markers scoped to a wedding. Status derived from existing domain state where possible; user override layer (`attested` / `dismissed`) takes precedence. Effective-status resolution; attestation and dismissal mutations.

### Modified Capabilities
<!-- None — no existing specs/ entries to modify. -->

## Impact

- **Schema**: new `Task`, `Milestone` models; new `TaskCategory`, `MilestoneCategory` enums; relations on `Wedding`, `Event`, optional FK to `Vendor`.
- **API**: new tRPC routers `task`, `milestone` registered in `src/server/api/root.ts`; `DashboardService` extended.
- **UI**: `src/components/dashboard/planning-overview.tsx` (CountdownHero, TasksCard, MilestonesCard, mini-stats) rewritten against real data; new `src/app/(authenticated)/checklist/page.tsx` route and `src/components/checklist/*` tree.
- **Etta**: `src/lib/etta/tools/timeline.ts` stubs replaced; new task tools file or extension; `ETTA_DEFAULT_PERMISSIONS` updated in `src/lib/etta/types.ts`.
- **Wedding creation flow**: `WeddingService.createWedding` (or its caller) seeds tasks and milestones after primary event creation.
- **No breaking changes**: feature flag `Wedding.enabledAddOns: ["tasks"]` already exists in schema (`prisma/schema.prisma:21`) — gates UI exposure.
