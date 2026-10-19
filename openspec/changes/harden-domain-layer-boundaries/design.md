# Design

## Context

See `proposal.md` for the motivation. The current state that shapes this design:

- tRPC v11, Zod v4, Prisma v7. The base procedure is `t.procedure.use(tracingMiddleware).use(analyticsMiddleware)`. `tracingMiddleware` reads `result.error.code` after `await next()` to set span status, so whatever code an error carries at that point is what observability records.
- Domain and application services are called both through tRPC and directly from server actions and pages (for example `householdInviteService` in `src/app/w/[websiteSubUrl]/save-the-date/update/page.tsx`, which branches on `TRPCError.code`). Mapping errors only in tRPC isn't enough on its own.
- `src/server/api/root.ts` imports routers from their files rather than from domain barrels, to avoid circular imports that caused TDZ errors in the bundle. `dashboard.router.ts` may build its own repositories for the same reason.
- `biome.json` already bans `@prisma/client` and `~/server/infrastructure/database` in `*.service.ts`. `event.service.ts`, `communication-log.service.ts` and others import `@prisma/client` anyway (type-only imports). Why the rule doesn't fire isn't known yet. `node_modules` wasn't installed in the session that wrote this, so it couldn't be checked.
- `src/lib/constants/rsvp.ts` already defines `RSVP_STATUS` and `RSVP_STATUS_VALUES`. Validators use `z.string()` for RSVP status in `invitation.validator.ts`, `website.validator.ts`, `rsvp-submission.validator.ts` and `household-management.validator.ts` (`invites: z.record(z.string(), z.string())`).
- `bulkCreateHouseholds` loops over `createHouseholdWithGuests`. Each household is its own transaction, and each one checks event scope. Errors other than authorization ones are counted as `failed`.

## Goals / Non-Goals

**Goals:**
- Domain and application code doesn't depend on `@trpc/server` or on Prisma runtime APIs, and lint enforces it.
- One place decides how a business failure becomes a transport error.
- Behavior stays the same apart from what the specs list as changed.

**Non-Goals:**
- Converting the RSVP column to a Postgres enum.
- Making bulk import atomic across households.
- Making wedding provisioning transactional (today it isn't, and this change keeps that).
- Masking internal error messages for public procedures. That's a real gap, but separate (see Open Questions).
- Aggregate redesign of Household, Guest and Invitation (step 4 of the evaluation).

## Decisions

### D1. `DomainError` class hierarchy, not Result types

`src/server/domains/shared/domain-error.ts` defines an abstract `DomainError extends Error` with a readonly `kind` discriminator, plus one subclass per category in `domain-error-contract`: `NotFoundError`, `ForbiddenError`, `ConflictError`, `ValidationError`, `PreconditionFailedError`, `InvariantViolationError`. Each takes an optional message and an optional `cause`.

- **Alternative: Result/Either return types.** Rejected. It changes every service signature and every caller, roughly 3x the diff for the same contract.
- **Alternative: `DomainError extends TRPCError`.** Rejected. It keeps the transport dependency we're trying to remove, and the lint ban couldn't be added.
- **Message preservation:** today `new TRPCError({ code: 'FORBIDDEN' })` with no message produces the message `FORBIDDEN`. The mapper keeps that: no message means the tRPC code string is used.

### D2. Mapping in an innermost tRPC middleware

`src/server/api/domain-error-mapping.ts` holds a `kind → TRPC code` table and a `toTRPCError(error)` function. A `domainErrorMiddleware` is added as the last `.use()` on `baseProcedure`, so it sits inside tracing and analytics:

```ts
const result = await next()
if (!result.ok && result.error.cause instanceof DomainError) {
  throw toTRPCError(result.error.cause) // keeps message and cause
}
return result
```

tRPC turns that throw into a failed result for the outer middlewares, so tracing records the mapped code and HTTP status.

- **Alternative: map in `errorFormatter`.** Rejected. The formatter only changes the response shape. `onError` in `route.ts` and the tracing middleware would still see `INTERNAL_SERVER_ERROR` (500), which corrupts span status and error reporting.
- **Validate early:** the first task adds a test that a `DomainError` thrown from a resolver reaches the client with the mapped code and is recorded by tracing with the mapped status. If tRPC's wrapping behaves differently than expected, it shows up before the sweep.
- Middlewares on `protectedProcedure` that run after `baseProcedure` (for example the session check) throw `TRPCError` themselves and pass through untouched.

### D3. Direct callers branch on `DomainError` subclasses

Server actions and pages that call services directly replace `error instanceof TRPCError && error.code === 'X'` with `error instanceof ForbiddenError` and so on. Services that re-throw selectively (`self-fill-registration`, `household-invite`, `household-management.bulkCreateHouseholds`) do the same.

### D4. RSVP status is owned by the invitation domain as a pure module

`src/server/domains/invitation/rsvp-status.ts` exports `RSVP_STATUS`, `RSVP_STATUS_VALUES`, `type RsvpStatus`, `isRsvpStatus(value)` and `rsvpStatusSchema = z.enum(RSVP_STATUS_VALUES)`. It imports nothing except `zod`, so client components can import it safely. `src/lib/constants/rsvp.ts` becomes a re-export, so the roughly 20 client files using it don't change.

- **Write types:** inputs to repositories and services that set `rsvp` take `RsvpStatus`. **Read types** stay `string`, because legacy rows may hold other values and the spec requires reads to keep working.
- **Alternative: keep the canonical list in `src/lib/constants`.** Rejected. It puts a core domain rule outside the domain. The pure-module constraint gives client safety either way.
- **Risk of the pure-module rule eroding:** a header comment says the file must stay dependency-free. A unit test asserts the module's import list contains only `zod`.

### D5. Validation at the Zod boundary

Every write schema swaps `z.string()` for `rsvpStatusSchema`, including the `invites` record values. Zod runs before any service code, which gives the all-or-nothing rejection the `rsvp-status` spec needs, with no changes to service logic. The `submitRsvp` transaction is untouched.

### D6. Transactions through a `UnitOfWork<R>` port

`src/server/infrastructure/database/unit-of-work.ts` exports:

```ts
type UnitOfWork<R> = <T>(work: (repos: R) => Promise<T>) => Promise<T>
function createUnitOfWork<R>(db: PrismaClient, build: (tx: TransactionClient) => R): UnitOfWork<R>
```

Each service declares the repositories it needs inside a transaction (for example `EventManagementRepos`), and its barrel binds them with `createUnitOfWork(db, (tx) => ({ ... }))`. Services receive a `UnitOfWork` in place of `PrismaClient`. This removes every `PrismaClient` import from services while keeping today's transaction boundaries exactly the same.

- **Refined during implementation:** the first draft had one central `RepositoryFactory` in infrastructure. That would have made infrastructure import every domain repository, inverting the dependency. A generic `UnitOfWork<R>` keeps the binding in each barrel, which already owns wiring.
- **Alternative: move all transactional flows into application services.** Partly taken. `EventService.createEvent`/`updateEvent` were dead duplicates of `EventManagementService` (the router already used the latter), so they were deleted rather than ported. `EventManagementService.createEventSystem` now serves wedding provisioning.
- **Alternative: keep `import type { PrismaClient }` and only ban value imports.** Rejected. The type still lets services call `db.household.findFirst`, which is the leak in `communication-log.service.ts`.
- **Side effect, a fix:** `SelfFillRegistrationService` called `$transaction(async () => ...)` but ran its writes on the global client, so they were not transactional. Through the unit of work they now are.

### D7. Where moved queries go

- `communication-log.service.ts` reads `household`, `invitation` and `gift` to build a timeline, which is a read model. Those queries move into `communication-log.repository.ts`. Moving them into each owning domain's repository was rejected, because the domain service would then depend on three other domains' repositories, which `claude.md` forbids.
- `household-management.service.ts` `tx.event.findMany` becomes `EventRepository.findIdsByWeddingId`.
- `checklist-seeding.service.ts` `wedding.findUnique` and related calls move into a `ChecklistSeedingRepository` in the checklist domain, which accepts a tx client like the other repositories.
- Event creation/update queries move into `EventRepository` (`create`, `update` gains `collectRsvp`, `findIdsByWeddingId`), `GuestRepository` (`findIdsForNewEvent`, `findTagAlongIdsWithoutInvitation`) and `InvitationRepository.createMany`, called through the unit of work.
- `household-invite.service.ts` had about ten flow-specific queries. They move, verbatim, into `application/household-invite/household-invite.repository.ts`, the same read-model rule as communication log.
- `rsvp-submission.service.ts` website lookup becomes `WebsiteRepository.findRsvpAccessBySubUrl`.

### D8. Wedding provisioning application service

`src/server/application/wedding-provisioning/` takes over `createWedding`. It calls `WeddingService.create` (repository only), then `guestTagService.seedInitialTags`, `eventService.createEventSystem`, `checklistSeedingService.ensureSeeded` and `provisionEtta`, in today's order and with today's error handling (checklist failure logged, Etta fire-and-forget). `WeddingService` loses its `EventService` and `GuestTagService` dependencies. `wedding.router.ts` `create` calls the provisioning service. Application services calling domain services is allowed by the layer table.

### D9. Bulk import pre-check in the service

`bulkCreateHouseholds` first collects every event id across the batch and runs `assertEventIdsInWeddingScope` once. Only then does it loop. The router's inline loop and its `eventService` import are deleted. The `FORBIDDEN` message becomes the service's existing one (`Event <id> is outside the requested wedding scope`), replacing the router's `Event <id> does not belong to your wedding`. That's the one deliberate message change, and the `household-bulk-import` spec only requires that the event is named.

### D10. Dashboard (and RSVP submission) wiring

`application/dashboard/index.ts` already builds `dashboardService`. It also builds and exports `dashboardOverviewUseCase`, and `dashboard.router.ts` imports both from a new `application/dashboard/dashboard.wiring.ts` rather than from the barrel, following the `root.ts` convention to avoid circular imports. `npm run build` proves there's no TDZ regression. `rsvp-submission.router.ts` had the same pattern and got the same `*.wiring.ts` treatment.

### D11. Lint enforcement

The Biome service override gains `"@trpc/server"` in `paths` and widens `includes` to `src/server/application/**/*.ts` and `src/server/authz/**/*.ts`, excluding `*.router.ts`. Before relying on it, the task list finds out why the existing `@prisma/client` ban doesn't flag type-only imports today, and fixes the config so both bans actually fire.

## Risks / Trade-offs

- **[Silent code drift in the sweep: a `TRPCError` code gets the wrong subclass]** → The mapping table is the single source. Router and authz-context tests, which assert tRPC codes, stay as they are and act as the regression net. Each module's service tests assert the subclass.
- **[A `DomainError` reaching tRPC through a path that skips `baseProcedure`]** → Every exported procedure builds on `baseProcedure`. A test enumerates `appRouter` procedures and asserts a thrown `NotFoundError` comes back as `NOT_FOUND`.
- **[Legacy RSVP values in production]** → Reads keep working (D4). Before deploying, run `SELECT rsvp, COUNT(*) FROM "Invitation" GROUP BY rsvp;`. If any value falls outside the list, editing that invitation in the UI would still work, since the UI only sends allowed values, but decide whether to normalize those rows first.
- **[Breaking change for RSVP clients]** → The only known clients are this app's own UI, CSV import and Etta tools, which all send `RSVP_STATUS` values. Old cached bundles during a deploy send the same literals.
- **[Circular import or TDZ from new wiring files]** → `npm run build` and a smoke load of `/dashboard` are part of the tasks.
- **[Large diff, hard to review]** → Ship as three PRs in this order: error foundation and sweep, RSVP status, layer fixes. Each one passes CI on its own.

## Migration Plan

1. **PR 1 (errors):** add `DomainError`, the mapper and the middleware with tests, then the module-by-module sweep, then direct callers, then the lint ban. No runtime behavior change.
2. **PR 2 (RSVP):** run the data audit query, add the RSVP status module and the schema swaps.
3. **PR 3 (layers):** `TransactionRunner`, query moves, provisioning service, bulk pre-check, dashboard wiring, `claude.md` update.

Rollback: each PR reverts on its own. None touches the schema.

## Open Questions

- Should public procedures mask non-domain error messages? Today tRPC passes an unknown error's message to the client. Deferrable, because it's additive to the mapping middleware and doesn't change this design.
- Once the data audit is clean, should a follow-up change move `rsvp` to a Prisma enum with `@map("Not Invited")`? Deferrable, since nothing here blocks it.
