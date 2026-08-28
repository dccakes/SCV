## 1. Schema and migration

- [x] 1.1 Add `Task` model to `prisma/schema.prisma` with all fields, relations, and indexes per design.md
- [x] 1.2 Add `Milestone` model with override fields and `(weddingId, key)` unique constraint
- [x] 1.3 Add `TaskCategory` enum (12 values) and `MilestoneCategory` enum (5 values)
- [x] 1.4 Add `Task.event` and `Task.vendor` relations; add `tasks` and `milestones` arrays to `Wedding`; add `tasks` to `Event`
- [x] 1.5 Run `npx prisma format` and `npx prisma validate`
- [x] 1.6 Generate migration via `npx prisma migrate dev --name add_task_and_milestone_system`
- [x] 1.7 Add backfill SQL to seed defaults for existing weddings that have at least one event

## 2. Seed data (RED → GREEN per CLAUDE.md TDD)

- [x] 2.1 Write failing unit test for `task.seed.ts`: returns 58 tasks with correct categories and `monthsBeforeWedding` distribution
- [x] 2.2 Implement `src/server/domains/task/task.seed.ts` to make the test pass
- [x] 2.3 Write failing unit test for `milestone.seed.ts`: returns 13 milestones with correct keys, categories, and positions
- [x] 2.4 Implement `src/server/domains/milestone/milestone.seed.ts` to make the test pass

## 3. Milestone derivation (pure function — TDD)

- [x] 3.1 Write failing tests in `tests/unit/domains/milestone/milestone.derivation.test.ts` covering each of the 13 keys against fixture states (state-driven keys: derive `done` and `pending` cases each)
- [x] 3.2 Write failing test for manual milestones returning `pending` regardless of state
- [x] 3.3 Write failing test for `rsvps_collected` ≥90% threshold (boundary cases: 89/100 → pending, 90/100 → done, 91/100 → done)
- [x] 3.4 Implement `src/server/domains/milestone/milestone.derivation.ts` to make tests pass

## 4. Milestone domain (repository, service, router)

- [x] 4.1 Create `src/server/domains/milestone/__mocks__/milestone.repository.ts` following the event mock pattern
- [x] 4.2 Write failing repository tests for CRUD, `findByWeddingIdWithEffectiveStatus` (combines fetch + derivation + override resolution)
- [x] 4.3 Implement `src/server/domains/milestone/milestone.repository.ts`
- [x] 4.4 Write failing service tests for `getEffectiveMilestones`, `attestMilestone`, `dismissMilestone`, `clearOverride`
- [x] 4.5 Implement `src/server/domains/milestone/milestone.service.ts`
- [x] 4.6 Add `src/server/domains/milestone/milestone.types.ts` and `milestone.validator.ts` (Zod schemas)
- [x] 4.7 Implement thin `src/server/domains/milestone/milestone.router.ts` and register in `src/server/api/root.ts`

## 5. Task domain (repository, service, router)

- [x] 5.1 Create `src/server/domains/task/__mocks__/task.repository.ts`
- [x] 5.2 Write failing repository tests for CRUD plus filter queries (category, eventId, status)
- [x] 5.3 Implement `src/server/domains/task/task.repository.ts`
- [x] 5.4 Write failing service tests for CRUD, `getPriorityQueue` (overdue + this-week + next-3 logic), event-id reassignment, cross-wedding eventId rejection
- [x] 5.5 Implement `src/server/domains/task/task.service.ts`
- [x] 5.6 Add `src/server/domains/task/task.types.ts` and `task.validator.ts` (Zod schemas)
- [x] 5.7 Implement thin `src/server/domains/task/task.router.ts` and register in `src/server/api/root.ts`

## 6. Wedding-creation seeding hook

- [x] 6.1 Write failing integration test: creating a wedding with one event seeds 58 tasks and 13 milestones
- [x] 6.2 Wire seed call into wedding creation flow at the right point (after primary event exists; locate via `WeddingService.createWedding`)
- [x] 6.3 Handle the case where a wedding is created without an event: seed runs on first event creation
- [x] 6.4 Verify backfill script (1.7) produces identical output to fresh-creation seeding

## 7. Etta tool integration

- [x] 7.1 Add `write:tasks` to `ETTA_DEFAULT_PERMISSIONS` in `src/lib/etta/types.ts`
- [x] 7.2 Replace stubs in `src/lib/etta/tools/timeline.ts`: `get_milestones` → real repository call; `complete_milestone` → `attestMilestone` + audit log
- [x] 7.3 Add new Etta tools `get_tasks(filter?)`, `complete_task(taskId)`, `add_task(input)` (in `timeline.ts` or new `src/lib/etta/tools/checklist.ts`)
- [x] 7.4 Write tests verifying permission gating and audit emission for all task/milestone tools

## 8. Dashboard wiring

- [x] 8.1 Extend `DashboardData` and dashboard service types to include task priority queue and milestones with effective status
- [x] 8.2 Update `DashboardService` (`src/server/application/dashboard/dashboard.service.ts`) to fetch tasks priority queue + milestones-with-effective-status in parallel with existing fetches
- [x] 8.3 Replace `planningPct = 67` (line 68) with `Math.round((completedMilestones / totalMilestones) * 100)`; update sub-bar copy
- [x] 8.4 Replace `TasksCard` body (lines 275–290) with real data via tRPC and the priority queue; remove `PLACEHOLDER_TASKS` from `use-tasks-card-state.ts`
- [x] 8.5 Implement task toggle mutation, quick-add modal (react-hook-form + Zod), and View-all link
- [x] 8.6 Replace `MilestonesCard` body (lines 405–468) with real milestones; render done/today/upcoming dot states; show `⚠ override` indicator when `userOverrideStatus` diverges from `derivedStatus`
- [x] 8.7 Replace mini-stats `Budget spent` tile (line 172) with `Tasks due this month`

## 9. `/checklist` page

- [x] 9.1 Create route at `src/app/(authenticated)/checklist/page.tsx`; server-fetch initial data via existing tRPC server caller pattern
- [x] 9.2 Build horizontal milestone timeline component
- [x] 9.3 Build filter chips (category / event / status) with URL-state sync
- [x] 9.4 Build bucketed task list component with collapsible buckets (`This week / This month / 3 months / 6 months / 9+ months / Day of / Done`)
- [x] 9.5 Build add-task modal (react-hook-form + Zod, defaults `eventId` to primary event)
- [x] 9.6 Build edit-task modal and delete confirmation
- [x] 9.7 Empty states (no tasks added yet, all done, no events yet)

## 10. Override popover/sheet

- [x] 10.1 Build milestone-detail component: popover on desktop (md+), bottom sheet on mobile (<md)
- [x] 10.2 Render current effective status, derived status, three radio options (Mark as done / Mark as not done / Use system status)
- [x] 10.3 Wire mutations: `attestMilestone`, `dismissMilestone`, `clearOverride`
- [x] 10.4 Tests for the override state machine on the front end (state transitions, indicator visibility)

## 11. Polish and verification

- [ ] 11.1 Mobile responsiveness review per CLAUDE.md breakpoints (mobile-first, `md:` for tablet, `lg:` for desktop)
- [x] 11.2 `npm run lint` passes
- [x] 11.3 `npm run test:unit` passes
- [x] 11.4 `npm run build` succeeds
- [ ] 11.5 Manual E2E pass on golden path: create wedding → 58 tasks + 13 milestones seeded with primary eventId
- [ ] 11.6 Manual E2E: mark a Vendor as `SELECTED` for `category=VENUE` → `venue_booked` derived status flips to `done`
- [ ] 11.7 Manual E2E: attest a manual milestone → dashboard reflects it; progress bar updates
- [ ] 11.8 Manual E2E: dismiss a derived-done milestone → dashboard shows pending and `⚠ override` indicator
- [ ] 11.9 Manual E2E: visit `/checklist` → filters work, time buckets correct, add/edit/delete work, override popover works on milestones
- [ ] 11.10 Manual E2E (Etta): "What tasks do I have this week?" → priority queue returned; "Mark venue as booked" → `complete_milestone` tool fires, attestation persisted, audit log entry exists
