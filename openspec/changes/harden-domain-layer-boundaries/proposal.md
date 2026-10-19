# Proposal

## Why

A DDD review of `src/server` found that the layer rules in `claude.md` have quiet exceptions. One of them affects behavior: bulk import only rejects out-of-scope events up front because the router does a pre-check. The service checks each household as it goes, so without the router a bad event in household N aborts the import after households 1 to N-1 are already saved. RSVP status, the most central value in the guest flow, is accepted as any string at every write path, including the public RSVP endpoint. Domain code also throws `TRPCError` directly, so business rules depend on the HTTP transport. These are cheap to fix now and get more expensive once seating and other guest list features build on them.

## What Changes

- **Layer rule fixes**
  - Move the whole-batch event scope pre-check out of `household.router.ts` (which calls `eventService` directly) and into `HouseholdManagementService.bulkCreateHouseholds`. Any caller then gets the all-or-nothing rejection for out-of-scope events.
  - Move direct Prisma queries out of `communication-log.service.ts`, `household-management.service.ts` (`tx.event.findMany`) and `checklist-seeding.service.ts` into repositories. `event.service.ts` keeps transaction control but stops running queries itself.
  - `dashboard.router.ts` stops constructing repositories. It gets a wired use case from the dashboard module barrel instead.
  - `WeddingService` stops calling other domains' services. Wedding provisioning (tags, default events, checklist seeding, Etta) moves into a `wedding-provisioning` application service.
- **RSVP status value object**
  - Make RSVP status a first-class domain value in the invitation domain: the canonical list, a type guard and a Zod schema.
  - Every write path validates RSVP status against that list: public RSVP submission, invitation create and update, household create, update and bulk import. **BREAKING** for any client that sends values outside `Invited`, `Attending`, `Declined`, `Not Invited`. Such requests now fail with `BAD_REQUEST`.
  - The database column stays `String`. No migration in this change.
- **Domain error type**
  - Add a transport-agnostic `DomainError` hierarchy (not found, forbidden, conflict, validation, precondition failed, invariant violation).
  - A single tRPC middleware translates `DomainError` to `TRPCError`, keeping today's codes and messages.
  - Replace every `TRPCError` thrown from `src/server/domains`, `src/server/application` and `src/server/authz` with a `DomainError`. Direct callers outside tRPC (for example `save-the-date/update/page.tsx`) switch to checking `DomainError`.
  - Extend the existing Biome `noRestrictedImports` override so services, application code and authz cannot import `@trpc/server`.
- **Docs**: update `claude.md` so the layer rules, the domain count and the error convention match the code, and remove the reference to the missing `DOMAIN_MIGRATION_PLAN.md`.

## Capabilities

### New Capabilities
- `rsvp-status`: The allowed RSVP status values and how every write path enforces them.
- `domain-error-contract`: How business rule failures surface to API clients and to server side callers, including which error code each failure category maps to.
- `household-bulk-import`: Event scope rules for importing many households at once.

### Modified Capabilities
None. No existing spec in `openspec/specs/` covers guests, invitations, RSVP or error handling.

## Impact

- **Code**: about 30 files in `src/server/domains`, `src/server/application` and `src/server/authz`. New files: `src/server/domains/shared/domain-error.ts`, `src/server/api/domain-error-mapping.ts`, `src/server/domains/invitation/rsvp-status.ts`, `src/server/infrastructure/database/transaction.ts`, `src/server/application/wedding-provisioning/` and `src/server/application/dashboard/dashboard.wiring.ts`.
- **Tests**: about 38 unit test files assert on `TRPCError` and need to assert on `DomainError` instead. Router and authz-context tests keep asserting tRPC codes, which stay the same.
- **API**: error codes and messages stay the same for every existing failure. The new failure is `BAD_REQUEST` for invalid RSVP values.
- **Client**: `src/lib/constants/rsvp.ts` stays the import point for UI code. It re-exports from the domain module so the client and server can't drift apart.
- **Database**: no schema change.
- **Lint**: `biome.json` service override gains `@trpc/server`. The override already bans `@prisma/client` in services, yet `event.service.ts` and others import it, so the task list includes finding out why that rule doesn't fire.
