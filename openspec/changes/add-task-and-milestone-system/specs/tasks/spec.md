## ADDED Requirements

### Requirement: Task domain entity

The system SHALL provide a `Task` domain entity scoped to a wedding, tied to an event, and persisted in the `Task` Prisma model. Each task SHALL have a `title`, `category` (from the `TaskCategory` enum), `monthsBeforeWedding` (integer, supporting `-1` for post-wedding through `12+`), optional `dueDate`, optional `description`, optional `notes`, optional FKs to `vendorId` and `milestoneId`, an `isDefault` boolean indicating whether it came from the seed, a `position` integer for user reordering, and a `completed` boolean defaulting to `false`. When `completed` becomes `true`, `completedAt` SHALL be set to the current timestamp; when it becomes `false`, `completedAt` SHALL be cleared.

#### Scenario: Persisting a task with required fields

- **WHEN** a task is created with `weddingId`, `eventId`, `title`, `category`, and `monthsBeforeWedding`
- **THEN** the row is persisted and returned with auto-generated `id`, `createdAt`, `updatedAt`, default `completed=false`, default `position=0`, and `isDefault=false` unless explicitly set

#### Scenario: Toggling completion sets and clears the timestamp

- **WHEN** a task is updated with `completed=true`
- **THEN** `completedAt` is set to the current timestamp
- **WHEN** the same task is updated back to `completed=false`
- **THEN** `completedAt` is cleared to `null`

### Requirement: TaskCategory enum

The system SHALL define a `TaskCategory` Prisma enum with the values `VENUE`, `VENDORS`, `ATTIRE`, `STATIONERY`, `GUESTS`, `LEGAL`, `CEREMONY`, `RECEPTION`, `BEAUTY`, `HONEYMOON`, `BUDGET`, `OTHER`. All Task rows SHALL have a non-null `category` value from this enum.

#### Scenario: Creating a task with an invalid category

- **WHEN** a task creation is attempted with a category not in the enum
- **THEN** Prisma rejects the write and the validator (Zod) rejects the input at the API boundary

### Requirement: Task.eventId is required and defaults to the primary event

The `Task.eventId` field SHALL be a required foreign key to `Event`. When seeding default tasks at wedding creation, the system SHALL resolve the primary event as `wedding.events.orderBy(createdAt asc).first()` and assign that event's id to every seeded task. The same default SHALL apply when a user creates a custom task without specifying an event.

#### Scenario: Default tasks seeded with primary event

- **WHEN** a wedding is created with at least one event
- **THEN** the seed function writes 58 default tasks, all with `eventId` equal to the wedding's first event by `createdAt`

#### Scenario: User creates custom task without specifying event

- **WHEN** a user submits a new task with no `eventId` field
- **THEN** the service resolves the primary event and persists the task with that `eventId`

### Requirement: Default task seed at wedding creation

The system SHALL seed 58 default tasks into a wedding when the wedding is created, after the primary event has been created. Each seeded task SHALL have `isDefault=true`. The seed SHALL be defined in code (not a database table) at `src/server/domains/task/task.seed.ts`. If a wedding is created without an event, the seed SHALL run on the next event creation.

#### Scenario: Wedding created with primary event

- **WHEN** a wedding and its first event are created in the same flow
- **THEN** 58 task rows are persisted with the correct `weddingId`, `eventId`, `category`, `monthsBeforeWedding`, `title`, and `isDefault=true`

#### Scenario: Wedding existed before this change rolls out

- **WHEN** a backfill is performed for an existing wedding that has at least one event
- **THEN** the same 58 default tasks are seeded for that wedding

### Requirement: Task CRUD via tRPC router

The system SHALL expose a tRPC router at `task` (registered in `src/server/api/root.ts`) with `protectedProcedure`s for `create`, `update`, `complete`, `delete`, `list`, and `getById`. The router SHALL be a thin orchestration layer per OSWP architecture: input validated by Zod, authorization checked, and the call delegated to `TaskService`. Business logic SHALL live in `TaskService`. Database access SHALL live in `TaskRepository`.

#### Scenario: Authenticated user lists tasks for their wedding

- **WHEN** a logged-in user calls `task.list` with their `weddingId`
- **THEN** the router delegates to the service and returns the full task list scoped to that wedding

#### Scenario: Unauthenticated request

- **WHEN** an unauthenticated request hits any task router endpoint
- **THEN** the request is rejected via the `protectedProcedure` middleware before reaching the service

### Requirement: Priority queue for the dashboard

The system SHALL provide a `getPriorityQueue(weddingId)` service method that returns up to six active (non-completed) tasks in priority order: (1) overdue tasks (`dueDate < today`), (2) tasks due this calendar week, (3) the next three undone tasks ordered by `monthsBeforeWedding` descending. The method SHALL also return the total count of active tasks for the footer.

#### Scenario: Overdue tasks come first

- **WHEN** the wedding has 2 overdue tasks, 1 due this week, and 30 future tasks
- **THEN** the priority queue returns the 2 overdue tasks, then the 1 this-week task, then the next 3 by `monthsBeforeWedding` order — 6 items total

#### Scenario: All tasks complete

- **WHEN** the wedding has zero active tasks
- **THEN** the priority queue returns an empty array and a `totalActive` of 0

### Requirement: Filtering and bucketing on the `/checklist` page

The system SHALL allow filtering the task list by `category`, `eventId`, and `status` (active / completed / all). Tasks SHALL be groupable into coarse time buckets: `This week`, `This month`, `3 months`, `6 months`, `9+ months`, `Day of`, `Done`. Bucket assignment SHALL be derived from `dueDate` when present, falling back to `monthsBeforeWedding`.

#### Scenario: Filter by category

- **WHEN** a user filters tasks by `category=LEGAL`
- **THEN** only tasks with `category=LEGAL` are returned

#### Scenario: Bucket assignment from `dueDate`

- **WHEN** a task has `dueDate` 4 days from today
- **THEN** the task is placed in the `This week` bucket regardless of its `monthsBeforeWedding` value

### Requirement: Task–event association is mutable

A user SHALL be able to change a task's `eventId` to any other event belonging to the same wedding. The router SHALL reject attempts to assign an `eventId` from a different wedding.

#### Scenario: Reassigning a task to a different event in the same wedding

- **WHEN** a user updates a task's `eventId` to another event in the same wedding
- **THEN** the task is persisted with the new event association

#### Scenario: Cross-wedding event assignment is rejected

- **WHEN** a user submits an `eventId` that belongs to a different wedding
- **THEN** the service throws a `TRPCError` with code `BAD_REQUEST` and the change is not persisted

### Requirement: Custom tasks alongside seeded tasks

Users SHALL be able to add, edit, and delete custom tasks. Custom tasks SHALL have `isDefault=false`. Default (seeded) tasks SHALL be editable and deletable too — the user owns their checklist.

#### Scenario: Deleting a default task

- **WHEN** a user deletes a task with `isDefault=true`
- **THEN** the task row is removed from the database

### Requirement: Etta task tools

The system SHALL provide Etta tools `get_tasks(filter?)`, `complete_task(taskId)`, and `add_task(input)` that delegate to the same `TaskService` methods used by the tRPC router. Each Etta-driven mutation SHALL emit an `AuditLog` entry via the existing `logAudit` helper. Etta SHALL gate write operations behind the `write:tasks` permission, added to `ETTA_DEFAULT_PERMISSIONS` in `src/lib/etta/types.ts`.

#### Scenario: Etta completes a task with the right permission

- **WHEN** Etta calls `complete_task(taskId)` on behalf of a couple actor with `write:tasks` permission
- **THEN** the task is marked completed, an audit log entry is written, and the tool returns success

#### Scenario: Etta lacks permission

- **WHEN** Etta calls `complete_task` without the `write:tasks` permission
- **THEN** the tool throws a permission error and the task is not modified
