## ADDED Requirements

### Requirement: Milestone domain entity

The system SHALL provide a `Milestone` domain entity scoped to a wedding and persisted in the `Milestone` Prisma model. Each milestone SHALL have a `key` (stable kebab-or-snake-case identifier, unique per wedding), `title`, `category` (from the `MilestoneCategory` enum), `position` integer for timeline ordering, optional `targetDate`, optional `userOverrideStatus` (string: `'attested'` or `'dismissed'` or null), optional `attestedAt`, and optional `dismissedAt`. The `(weddingId, key)` pair SHALL be unique.

#### Scenario: Persisting a milestone with required fields

- **WHEN** a milestone is created with `weddingId`, `key`, `title`, `category`, and `position`
- **THEN** the row is persisted with `userOverrideStatus=null`, `attestedAt=null`, `dismissedAt=null`

#### Scenario: Duplicate key for the same wedding rejected

- **WHEN** a second milestone is created with the same `weddingId` and `key` as an existing milestone
- **THEN** Prisma rejects the write due to the unique constraint

### Requirement: MilestoneCategory enum

The system SHALL define a `MilestoneCategory` Prisma enum with the values `SETUP`, `VENDORS`, `INVITATIONS`, `LEGAL`, `FINALE`. All Milestone rows SHALL have a non-null `category` value from this enum.

#### Scenario: Creating a milestone with an invalid category

- **WHEN** a milestone creation is attempted with a category not in the enum
- **THEN** Prisma rejects the write and the validator (Zod) rejects the input at the API boundary

### Requirement: Default milestone seed at wedding creation

The system SHALL seed 13 default milestones into a wedding when the wedding is created, after the primary event has been created. The seed SHALL be defined in code at `src/server/domains/milestone/milestone.seed.ts` and SHALL include the canonical 13 milestone keys: `date_set`, `guest_list_drafted`, `venue_booked`, `photographer_booked`, `caterer_booked`, `florist_booked`, `save_the_dates_sent`, `invitations_sent`, `rsvps_collected`, `officiant_chosen`, `marriage_license_obtained`, `final_headcount_sent`, `wedding_day`.

#### Scenario: Wedding created with primary event

- **WHEN** a wedding and its first event are created in the same flow
- **THEN** 13 milestone rows are persisted with the correct `weddingId`, `key`, `title`, `category`, and `position`

### Requirement: Derivation function

The system SHALL provide a pure derivation function at `src/server/domains/milestone/milestone.derivation.ts` that, given a milestone key and a wedding state snapshot, returns `'done'` or `'pending'`. The function SHALL implement the following derivation rules:

| key | rule |
|---|---|
| `date_set` | primary event has `date != null` |
| `guest_list_drafted` | `Guest.count >= 1` |
| `venue_booked` | a `Vendor` exists with `category=VENUE` and `status=SELECTED` |
| `photographer_booked` | a `Vendor` exists with `category=PHOTOGRAPHER` and `status=SELECTED` |
| `caterer_booked` | a `Vendor` exists with `category=CATERING` and `status=SELECTED` |
| `florist_booked` | a `Vendor` exists with `category=FLOWERS` and `status=SELECTED` |
| `rsvps_collected` | `(Invitation.where(rsvp != 'Invited').count) / total >= 0.9` |
| `wedding_day` | primary event date is in the past |
| `save_the_dates_sent`, `invitations_sent`, `officiant_chosen`, `marriage_license_obtained`, `final_headcount_sent` | always `'pending'` (manual milestones in V1) |

The function SHALL NOT depend on the database directly; it operates on a state snapshot passed in. This makes it unit-testable in isolation.

#### Scenario: `venue_booked` is `done` when a SELECTED venue vendor exists

- **WHEN** the wedding state includes a Vendor with `category=VENUE` and `status=SELECTED`
- **THEN** `derive('venue_booked', state)` returns `'done'`

#### Scenario: `venue_booked` is `pending` when no SELECTED venue exists

- **WHEN** the wedding state includes only Vendors with `status=IN_REVIEW` or `category != VENUE`
- **THEN** `derive('venue_booked', state)` returns `'pending'`

#### Scenario: `rsvps_collected` threshold

- **WHEN** the wedding has 100 invitations of which 91 have rsvp != `Invited`
- **THEN** `derive('rsvps_collected', state)` returns `'done'`
- **WHEN** only 89 of 100 invitations have replied
- **THEN** `derive('rsvps_collected', state)` returns `'pending'`

#### Scenario: Manual milestones always derive pending

- **WHEN** `derive('marriage_license_obtained', anyState)` is called
- **THEN** the function returns `'pending'`

### Requirement: Effective status resolution (override always wins)

The system SHALL compute a milestone's effective status as `userOverrideStatus ?? deriveFromState(milestone, state)`. Override values SHALL map: `'attested'` → `'done'`, `'dismissed'` → `'pending'`. The repository helper `MilestoneRepository.findByWeddingIdWithEffectiveStatus(weddingId)` SHALL return each milestone with three computed fields: `derivedStatus`, `userOverrideStatus`, and `effectiveStatus`.

#### Scenario: Override `attested` overrides a pending derived state

- **WHEN** `derivedStatus='pending'` and `userOverrideStatus='attested'`
- **THEN** `effectiveStatus='done'`

#### Scenario: Override `dismissed` overrides a done derived state

- **WHEN** `derivedStatus='done'` and `userOverrideStatus='dismissed'`
- **THEN** `effectiveStatus='pending'`

#### Scenario: No override falls back to derived

- **WHEN** `userOverrideStatus=null` and `derivedStatus='done'`
- **THEN** `effectiveStatus='done'`

### Requirement: Override mutations

The system SHALL expose service methods `attestMilestone(milestoneId)`, `dismissMilestone(milestoneId)`, and `clearOverride(milestoneId)`. These SHALL set `userOverrideStatus` to `'attested'`, `'dismissed'`, or `null` respectively, and update `attestedAt` / `dismissedAt` accordingly. The router SHALL expose these as tRPC mutations behind `protectedProcedure`.

#### Scenario: Attesting a milestone

- **WHEN** a user calls `attestMilestone(id)`
- **THEN** the milestone row has `userOverrideStatus='attested'` and `attestedAt` set to the current timestamp

#### Scenario: Clearing an override

- **WHEN** a milestone with `userOverrideStatus='attested'` has `clearOverride(id)` called
- **THEN** `userOverrideStatus`, `attestedAt`, and `dismissedAt` are all cleared to `null`

### Requirement: Milestone-driven dashboard progress bar

The dashboard `CountdownHero` component SHALL compute its `planningPct` as `Math.round((completedMilestones / totalMilestones) * 100)`, where `completedMilestones` is the count of milestones whose `effectiveStatus='done'`. The sub-bar copy SHALL read `"{done} of {total} milestones complete"`.

#### Scenario: Wedding with 8 of 13 milestones effectively done

- **WHEN** the dashboard renders for a wedding with 8 milestones effectively done out of 13 total
- **THEN** the progress bar fills to ~62% and the sub-bar reads `"8 of 13 milestones complete"`

### Requirement: Override divergence indicator

The UI SHALL surface a small `⚠ override` indicator next to a milestone whenever `userOverrideStatus` is non-null AND maps to a different effective status than the derived status. (E.g., user attested but system would have said pending; or user dismissed but system would have said done.)

#### Scenario: Attested while system derives pending

- **WHEN** `userOverrideStatus='attested'` and `derivedStatus='pending'`
- **THEN** the milestone card shows the override indicator

#### Scenario: Override matches derived

- **WHEN** `userOverrideStatus='attested'` and `derivedStatus='done'`
- **THEN** no override indicator is shown (the override is redundant with reality)

### Requirement: Etta milestone tools

The system SHALL replace the existing stubs in `src/lib/etta/tools/timeline.ts`. The real `get_milestones` tool SHALL return the result of `MilestoneRepository.findByWeddingIdWithEffectiveStatus(weddingId)` with `effectiveStatus` included. The real `complete_milestone(title)` tool SHALL look up the milestone by title (or by key if provided), call `attestMilestone`, and emit an audit log entry. The existing `write:milestone_status` permission already in `ETTA_DEFAULT_PERMISSIONS` SHALL gate the mutation.

#### Scenario: Etta retrieves milestones

- **WHEN** Etta calls `get_milestones`
- **THEN** the tool returns all 13 milestones for the wedding, each with `derivedStatus`, `userOverrideStatus`, and `effectiveStatus` fields

#### Scenario: Etta completes a milestone

- **WHEN** Etta calls `complete_milestone({ title: 'Marriage license obtained' })` on behalf of a couple actor
- **THEN** the corresponding milestone has `userOverrideStatus='attested'` and `attestedAt` set, and an audit log entry exists with `action='complete_milestone'` and `resourceType='milestone'`
