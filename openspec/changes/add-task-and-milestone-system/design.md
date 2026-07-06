## Context

OSWP follows a strict layered architecture (router → service → repository) with TDD, schema-first Zod validation, and explicit domain folders under `src/server/domains/`. The dashboard at `src/components/dashboard/planning-overview.tsx` already lays out card slots for `TasksCard` (lines 275–290) and `MilestonesCard` (lines 405–468), but they render hardcoded `PLACEHOLDER_TASKS` and `staticMilestones`. Etta's `src/lib/etta/tools/timeline.ts` is a stub with the comment *"Stub — full implementation requires a Milestone Prisma model."* The Wedding entity already declares `enabledAddOns: ["tasks"]` in `prisma/schema.prisma:21`, anticipating this work.

The Vendor model uses an enum-based status lifecycle (`VendorStatus`: `IN_REVIEW` → `PRE_SELECTED` → `IN_NEGOTIATION` → `SELECTED` / `DECLINED` / `NOT_AVAILABLE`) and `VendorCategory` enum (`VENUE`, `CATERING`, `PHOTOGRAPHER`, `VIDEOGRAPHER`, `MUSIC`, `FLOWERS`, `OTHER`). The dashboard service already treats the first event by `createdAt` as the "primary event" (`src/server/application/dashboard/dashboard.service.ts:107`).

After researching The Knot, Zola, Hitched.co.uk, and Joy, we found that no competitor models milestones separately or derives them from product state — they all ship a flat checklist with a generic progress bar. OSWP's existing domain richness (Vendor, Event, Invitation) means we can compute milestone status honestly from real data, which is the central design wager of this change.

## Goals / Non-Goals

**Goals:**
- Two new domains (`task`, `milestone`) following the established layered pattern, with full unit-test coverage of business logic (TDD per CLAUDE.md).
- Honest milestone status: derived from existing state where possible; user-overrideable always.
- Lean default seed: 13 milestones + 58 tasks, leaner than competitors' 80–150.
- Tasks tied to events, defaulting to the primary event — forward-compatible with future "runtime schedules" (sub-events).
- Replace all placeholder UI with real data; new `/checklist` deep view.
- Etta integration: real tools wired to the new domains; new `write:tasks` permission.

**Non-Goals (V1):**
- Reminder/notification system (push, email, SMS) — V2.
- Task assignees / collaborator roles — V2 alongside collaborator features.
- Onboarding wizard with cultural/religious traditions (Zola-style) — Etta will iterate the seed list post-V1.
- Auto-creation of tasks from other domain events (e.g., creating a Task when a Vendor enters `IN_NEGOTIATION`) — V2.
- Template versioning or migrating existing weddings to a new template — V2.
- Cross-cascade: completing a task does NOT mutate milestone state. They are independent surfaces; the user attests milestones explicitly.

## Decisions

### Decision 1: Two-domain model (task + milestone) vs single combined entity

**Choice:** Separate `Task` and `Milestone` domains.

**Rationale:** Tasks (work) and milestones (progress markers) have different cardinalities (~58 vs ~13), different lifecycles (CRUD vs derived-with-override), and different UI surfaces. Combining them under one entity would force conditional fields and weaken the type system. Separate entities also let milestones evolve as a derivation-first surface without dragging task ergonomics with them.

**Alternatives considered:**
- *Single `ChecklistItem` with a `kind` discriminator*: simpler schema, but every consumer (router, dashboard, Etta) would need to fork on `kind`. The override mechanic only applies to milestones, which would force nullable fields on the table.
- *Milestones as a view over tasks (no separate table)*: rejected because milestones have lifecycle state (`userOverrideStatus`, `attestedAt`) that needs persistence.

### Decision 2: Milestones derived from state with persistent override layer

**Choice:** `effectiveStatus = userOverrideStatus ?? deriveFromState(milestone, weddingState)`.

The pure derivation function lives in `src/server/domains/milestone/milestone.derivation.ts` and is testable in isolation. Override values: `'attested'` → done, `'dismissed'` → pending, `null` → use derived. Persisted columns: `userOverrideStatus`, `attestedAt`, `dismissedAt`. Repository helper `findByWeddingIdWithEffectiveStatus` returns each milestone with `derivedStatus`, `userOverrideStatus`, and `effectiveStatus` computed for the UI.

**Rationale:** Derivation keeps milestones honest with system reality and avoids double bookkeeping. But off-platform reality exists ("license obtained at the courthouse last Tuesday" — system can't know). An override layer always-wins gives users full control without losing the derived signal, which the UI can still surface as an `⚠ override` indicator when override and derived diverge.

**Alternatives considered:**
- *Pure derivation, no override*: brittle for off-platform truth; users would feel the system was wrong.
- *Pure manual, like competitors*: throws away OSWP's structural advantage; redundant bookkeeping for users.
- *Cascade task-completion to milestone status*: rejected to keep the two surfaces independent and avoid surprising state changes.

### Decision 3: Default seed list as code (no `TaskTemplate` model)

**Choice:** Static constants in `task.seed.ts` and `milestone.seed.ts`. The seed function runs once per wedding at creation time and writes concrete rows.

**Rationale:**
- Type-safe and reviewable in PRs.
- Easy to test the seed function in isolation.
- Avoids template-versioning complexity in V1 (existing weddings keep their seeded rows; if the template changes, those changes only affect new weddings).
- Future: when we want to retroactively add new template tasks to existing weddings, we can introduce a `TaskTemplate` table or a one-off migration — but that's a V2 concern.

**Alternatives considered:**
- *`TaskTemplate` model with versioning*: over-engineered for V1.
- *YAML/JSON seed files*: weaker typing; loses TS refactor support.

### Decision 4: `Task.eventId` is required, defaults to primary event

**Choice:** Required FK to `Event`, resolved at seed time as `wedding.events.orderBy(createdAt asc).first().id` — matching the existing pattern in `dashboard.service.ts:107`.

**Rationale:** Per user direction, tasks should always have event context. Defaulting to the ceremony/main event makes onboarding silent (users don't choose). Forward-compat with future sub-events: when "runtime schedules" land, users can re-target individual tasks to rehearsal/brunch/etc. without a migration; the default-resolver logic just becomes more sophisticated.

**Alternatives considered:**
- *Nullable `eventId`*: simpler now, but commits to "wedding-level tasks exist" — which we want to phase out in favor of always-event-scoped.
- *Per-event task tables*: explosion of complexity; sub-events aren't here yet.

### Decision 5: Milestone-driven hero progress bar

**Choice:** `planningPct = Math.round((completedMilestones / totalMilestones) * 100)`. Sub-bar copy: `"{done} of {total} milestones complete"` instead of `"{n}% of planning complete"`.

**Rationale:** A task-completion ratio is misleading — a couple who's added 30 custom tasks looks "less done" than one with the lean default. Milestones are scarce (~13) and meaningful, so each one moves the bar a noticeable chunk and the math matches the user's narrative ("we're 60% of the way there"). The `n of total` copy is more honest than a percentage and matches OSWP's `DESIGN.md` voice.

**Alternatives considered:**
- *Task-driven bar*: skewed by user-added tasks.
- *Weighted milestone bar*: closer-to-day milestones weigh more. Likely overkill for V1; revisit if user research shows it matters.

### Decision 6: Single `/checklist` deep page, not separate `/tasks` and `/milestones`

**Choice:** One combined route. Milestone timeline at the top, filterable bucketed task list below.

**Rationale:** Users mentally treat the wedding checklist as a singular thing. Two separate pages would add navigation friction and split a coherent context. The page can still surface the milestone vs task distinction visually.

### Decision 7: Coarse time bucketing (5–6 ranges), not per-month (16+)

**Choice:** Buckets like `This week / This month / 3 months / 6 months / 9+ months / Day of / Done` (Hitched/Joy-style), not `12mo / 11mo / 10mo / …` (Knot/Zola-style).

**Rationale:** Lean and calm; matches OSWP's voice. Most months early on are sparsely populated, so per-month buckets create lots of empty groups.

### Decision 8: Etta tool surface

Replace the existing stubs in `src/lib/etta/tools/timeline.ts`:
- `get_milestones` → reads from `MilestoneRepository.findByWeddingIdWithEffectiveStatus`
- `complete_milestone` → sets `userOverrideStatus = 'attested'`, `attestedAt = now()`

Add new tools (same file or split into `tasks.ts`):
- `get_tasks(filter?)` — supports `category`, `eventId`, `status` filters
- `complete_task(taskId)`
- `add_task(input)` — Zod-validated; falls back to primary event if `eventId` not provided

Permission `write:milestone_status` already exists in `ETTA_DEFAULT_PERMISSIONS` (`src/lib/etta/types.ts:62`); add `write:tasks` to the same const. All Etta-driven mutations call `logAudit` (existing pattern) for traceability.

## Seed List (canonical)

### Milestones (13)

| # | key | title | category | derivation |
|---|---|---|---|---|
| 1 | `date_set` | Date set | SETUP | Primary event has `date != null` |
| 2 | `guest_list_drafted` | Guest list drafted | SETUP | `Guest.count >= 1` (manual override likely common) |
| 3 | `venue_booked` | Venue booked | VENDORS | Vendor with `category=VENUE` and `status=SELECTED` exists |
| 4 | `photographer_booked` | Photographer booked | VENDORS | Vendor with `category=PHOTOGRAPHER` and `status=SELECTED` exists |
| 5 | `caterer_booked` | Caterer booked | VENDORS | Vendor with `category=CATERING` and `status=SELECTED` exists |
| 6 | `florist_booked` | Florist booked | VENDORS | Vendor with `category=FLOWERS` and `status=SELECTED` exists |
| 7 | `save_the_dates_sent` | Save-the-dates sent | INVITATIONS | Manual (V1) — future: `Invitation.savedTheDateAt` field |
| 8 | `invitations_sent` | Invitations sent | INVITATIONS | Manual (V1) — future: `Invitation.sentAt` field |
| 9 | `rsvps_collected` | RSVPs collected | INVITATIONS | `Invitation.where(rsvp != 'Invited').count / total >= 0.9` |
| 10 | `officiant_chosen` | Officiant chosen | LEGAL | Manual |
| 11 | `marriage_license_obtained` | Marriage license obtained | LEGAL | Manual |
| 12 | `final_headcount_sent` | Final headcount sent to caterer | FINALE | Manual |
| 13 | `wedding_day` | Wedding day | FINALE | Primary event date in past |

### Tasks (58)

Format: `monthsBeforeWedding | category | title | linked milestone (if any)`

**12+ months out (10)**
- 12 | BUDGET | Set the wedding budget
- 12 | GUESTS | Decide rough guest count
- 12 | VENUE | Decide ceremony location/region
- 12 | VENUE | Tour ceremony venues
- 12 | VENUE | Tour reception venues (if separate from ceremony)
- 12 | VENUE | Book ceremony venue → `venue_booked`
- 12 | VENUE | Book reception venue (if separate) → `venue_booked`
- 12 | VENDORS | Hire wedding planner (optional)
- 12 | OTHER | Decide on overall vision and style
- 12 | ATTIRE | Start research on dress / suit options

**9 months out (10)**
- 9 | GUESTS | Finalize guest list (first pass) → `guest_list_drafted`
- 9 | VENDORS | Book photographer → `photographer_booked`
- 9 | VENDORS | Book videographer (optional)
- 9 | VENDORS | Book caterer → `caterer_booked`
- 9 | CEREMONY | Choose officiant → `officiant_chosen`
- 9 | STATIONERY | Send save-the-dates → `save_the_dates_sent`
- 9 | ATTIRE | Order or buy wedding dress / suit
- 9 | VENDORS | Book DJ or band
- 9 | OTHER | Set up wedding website
- 9 | GUESTS | Block hotel rooms for out-of-town guests

**6 months out (9)**
- 6 | VENDORS | Book florist → `florist_booked`
- 6 | BEAUTY | Book hair & makeup artist
- 6 | OTHER | Choose wedding party
- 6 | ATTIRE | Order wedding party attire
- 6 | HONEYMOON | Plan honeymoon
- 6 | CEREMONY | Choose ceremony readings and music
- 6 | OTHER | Order wedding bands
- 6 | STATIONERY | Decide on invitation design
- 6 | STATIONERY | Order full stationery suite

**3 months out (8)**
- 3 | STATIONERY | Send formal invitations → `invitations_sent`
- 3 | ATTIRE | Schedule dress / suit fittings
- 3 | CEREMONY | Write vows
- 3 | RECEPTION | Plan rehearsal dinner
- 3 | LEGAL | Research marriage license requirements
- 3 | VENDORS | Confirm details with all booked vendors
- 3 | CEREMONY | Plan ceremony order and timing
- 3 | OTHER | Buy wedding rings (if not already done)

**1 month out (9)**
- 1 | GUESTS | Collect outstanding RSVPs → `rsvps_collected`
- 1 | RECEPTION | Send final headcount to caterer → `final_headcount_sent`
- 1 | GUESTS | Create seating chart
- 1 | ATTIRE | Final dress / suit fitting
- 1 | OTHER | Confirm transportation arrangements
- 1 | HONEYMOON | Confirm honeymoon details
- 1 | LEGAL | Get marriage license → `marriage_license_obtained`
- 1 | BUDGET | Pay remaining vendor balances
- 1 | HONEYMOON | Pack for honeymoon

**1–2 weeks out (5)** — `monthsBeforeWedding = 0`
- 0 | VENDORS | Confirm vendor arrival times
- 0 | VENDORS | Provide shot list to photographer
- 0 | VENUE | Final venue walkthrough
- 0 | OTHER | Pick up wedding rings
- 0 | ATTIRE | Break in wedding shoes (if new)

**Day before (3)** — `monthsBeforeWedding = 0`
- 0 | CEREMONY | Wedding rehearsal
- 0 | RECEPTION | Rehearsal dinner
- 0 | OTHER | Pack overnight bag

**Day of (3)** — `monthsBeforeWedding = 0`
- 0 | BEAUTY | Hair and makeup
- 0 | CEREMONY | Hand off rings to officiant
- 0 | OTHER | Enjoy the day

**After (1)** — `monthsBeforeWedding = -1`
- -1 | GUESTS | Send thank-you notes

## UX Specification

### CountdownHero — fix

Replace the hardcoded `planningPct = 67` (`src/components/dashboard/planning-overview.tsx:68`) with `Math.round((completedMilestones / totalMilestones) * 100)`. Update sub-bar copy to `"{done} of {total} milestones complete"`.

### TasksCard

Selection logic for the dashboard card (priority queue):
1. Overdue tasks (top, with red ⚠)
2. Due-this-week tasks (with amber)
3. Next 3 by `monthsBeforeWedding` countdown

Cap at 5–6 visible. Footer: `"{visible} of {totalActive}"`.

Interactions:
- Checkbox click → toggle `completed` (instant tRPC mutation)
- Row click → detail sheet (description, edit, skip)
- `+ Add task` → quick-add modal (title, category, eventId default = primary, dueDate optional)
- `View all →` → `/checklist`

### MilestonesCard

Renders ~7 milestones: previous 2 done + current + next 2 + wedding day (always pinned). Visual states:
- `done` (effective): filled green
- `today` (current month or `targetDate` this month): amber halo
- `upcoming`: outline
- Override indicator: small `⚠` glyph when `userOverrideStatus` differs from derived

Click on a milestone → popover (desktop) or bottom sheet (mobile) showing:
- Current effective status
- Derived status (computed)
- Three radio options: Mark as done / Mark as not done / Use system status
- Optional copy: tip explaining auto-derivation

### Mini-stats card

Replace placeholder `Budget spent` tile (line 172) with `Tasks due this month` until budget add-on ships.

### `/checklist` page (new route at `src/app/(authenticated)/checklist/page.tsx`)

```
[ Milestone timeline (horizontal) ]
[ Filters: category | event | status ]
[ Time-bucketed task list ]
  ▾ This week
  ▾ This month
  ▾ 3 months
  ▾ 6 months
  ▾ 9+ months
  ▾ Day of
  ▾ Done (collapsed by default)
[ + Add task ]
```

## Risks / Trade-offs

- [Derivation drift] Vendor/Invitation schemas may evolve and break derivation. → Mitigation: `milestone.derivation.ts` is a pure function with full unit-test coverage; schema changes will fail tests loudly.
- [Override confusion] Users may toggle `dismissed` and forget the system would have derived `done` later. → Mitigation: dashboard surfaces `⚠ override` indicator; override popover always shows current derived status alongside the override.
- [Eventually-stale seeds] As we learn from users, the lean 58-task default may need iteration; existing weddings will keep their original seed. → Mitigation: V2 will introduce template-versioning; for now this is acceptable.
- [Wedding without primary event] If wedding creation flow ever creates a Wedding without an Event, seeding fails. → Mitigation: seed runs after primary event creation; service throws clearly if invariant violated; covered by integration test.
- [Milestone seed migration on existing weddings] The change adds milestones to weddings created before this PR. → Mitigation: ship a one-time backfill script in the same migration that creates default seeds for any existing weddings missing them.
- [Task explosion in `/checklist`] Couples who add many custom tasks may see long bucketed lists. → Mitigation: filter chips by category/event/status; "Done" bucket collapsed by default.

## Migration Plan

1. **Schema migration**: add `Task`, `Milestone`, enums; relations on `Wedding`, `Event`, optional FK on `Vendor`. Generate via `npx prisma migrate dev`.
2. **Backfill script**: same migration includes a SQL-or-script step that seeds defaults for every existing `Wedding` row that has at least one Event (use the first by `createdAt`). Weddings without events get seeded the next time an event is created.
3. **Feature gating**: the existing `Wedding.enabledAddOns` array gates UI exposure. Default to gated-on for V1 since the placeholders already imply availability; remove gate guards once tests pass in production.
4. **Rollback**: deletion is destructive (foreign keys cascade from Wedding). Rollback strategy: revert the migration, which drops the tables. Loss of any user-entered tasks/milestones is the cost — document in PR.

## Open Questions

- Should `monthsBeforeWedding` for "1–2 weeks out / day before / day of" all use `0` and rely on `dueDate` to differentiate? Or extend the field to `-2 / -3` for sub-zero buckets? **Tentative answer:** keep `0` for all sub-month items and use `dueDate` (computed at seed from wedding date offset) for ordering within the bucket. Revisit if UI needs sharper grouping.
- Should the `/checklist` route be `/checklist` or nested under `/dashboard/checklist`? **Tentative answer:** top-level `/checklist` — matches user vocabulary and simpler nav.
- For the `rsvps_collected` derivation threshold (>=90%), should it be configurable per wedding? **Tentative answer:** hardcode 90% in V1; revisit if user feedback demands tuning.
