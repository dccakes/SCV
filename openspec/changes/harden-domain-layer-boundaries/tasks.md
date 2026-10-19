# Tasks

Groups 1 to 4 are PR 1, group 5 is PR 2, groups 6 to 10 are PR 3 (see design.md, Migration Plan). Test-first throughout: write or adjust the failing test, then the code.

## 1. Domain error foundation (PR 1)

- [ ] 1.1 Add `src/server/domains/shared/domain-error.ts` with `DomainError` and the six subclasses (D1), and verify with a unit test that each subclass exposes its `kind`, message and `cause`
- [ ] 1.2 Add `src/server/api/domain-error-mapping.ts` with the `kind → code` table and `toTRPCError`, and verify with a unit test covering every kind, including the no-message case producing the code string as message
- [ ] 1.3 Add `domainErrorMiddleware` as the innermost `.use()` on `baseProcedure` (D2), and verify with a test that a resolver throwing `NotFoundError('x')` returns `NOT_FOUND` with message `x` and that `trpc-tracing` records status 404, not 500
- [ ] 1.4 Add a test that walks `appRouter` procedures and asserts a `ForbiddenError` from each surfaces as `FORBIDDEN`, and verify it passes
- [ ] 1.5 Add an "Errors" subsection to `claude.md` (services throw `DomainError`, routers may throw `TRPCError`) and verify the example compiles against the real module path

## 2. Error sweep: authz and domain services (PR 1)

- [ ] 2.1 Convert `src/server/authz/active-wedding.ts`, `organization-scope.ts` and `permission-checker.ts`, and verify `tests/unit/server/authz/organization-scope.test.ts` asserts subclasses and all `*.router.authz-context.test.ts` still pass unchanged
- [ ] 2.2 Convert the guest list domains (guest, guest-tag, invitation, gift, question), and verify their service tests assert subclasses and their router tests pass unchanged
- [ ] 2.3 Convert the planning domains (event, task, milestone, budget), and verify the same way
- [ ] 2.4 Convert the remaining domains (user, vendor, website, website-section, wedding, messaging, communication-log), and verify the same way
- [ ] 2.5 Verify `grep -rl TRPCError src/server/domains --include=*.service.ts` returns nothing

## 3. Error sweep: application services and direct callers (PR 1)

- [ ] 3.1 Convert the application services (event-management, guest-insights, household-invite, household-management, member-management, rsvp-submission, self-fill-registration, website-management), replacing selective `instanceof TRPCError` re-throws with subclass checks (D3), and verify their tests in `tests/unit/application/**` pass with subclass assertions
- [ ] 3.2 Update `src/app/w/[websiteSubUrl]/save-the-date/update/page.tsx` to branch on `ForbiddenError`, `ValidationError` and `ConflictError`, and verify with a test covering the `expired`, `validation` and `save` redirects from the `domain-error-contract` spec
- [ ] 3.3 Grep `src/app` and `src/lib` for other `instanceof TRPCError` or `.code ===` checks on service errors, convert any found, and record "none" in the PR description if there are none

## 4. Lint enforcement for errors (PR 1)

- [ ] 4.1 Install dependencies and reproduce why the existing `@prisma/client` ban in `biome.json` doesn't flag `event.service.ts`, and write the cause in the PR description
- [ ] 4.2 Fix the override (D11) so it bans `@trpc/server` across services, application and authz (excluding routers), and verify `npm run lint` fails on a scratch file importing `TRPCError` in a service and passes on the real tree
- [ ] 4.3 Run `npm run lint`, `npx tsc --noEmit` and `npm run test:unit`, and verify all three are clean before opening PR 1

## 5. RSVP status value (PR 2)

- [ ] 5.1 Run `SELECT rsvp, COUNT(*) FROM "Invitation" GROUP BY rsvp;` against production, record the result in the PR description, and stop to decide on normalization if any value is outside the four allowed
- [ ] 5.2 Add `src/server/domains/invitation/rsvp-status.ts` (D4) with tests for `isRsvpStatus` (exact case only) and `rsvpStatusSchema`, plus a test that the file imports only `zod`
- [ ] 5.3 Make `src/lib/constants/rsvp.ts` re-export from the domain module, and verify `npx tsc --noEmit` passes with no client file changes
- [ ] 5.4 Swap `z.string()` for `rsvpStatusSchema` in `invitation.validator.ts`, `website.validator.ts`, `rsvp-submission.validator.ts` and the `invites` record in `household-management.validator.ts`, and verify with validator tests for each scenario in the `rsvp-status` spec (casing, mixed valid and invalid submission, household create, bulk import)
- [ ] 5.5 Narrow repository and service write inputs for `rsvp` to `RsvpStatus` while read types stay `string`, and verify with a test that loading a guest list containing a legacy value succeeds
- [ ] 5.6 Add a test in `tests/unit/domains/website/website.router.public-rsvp.test.ts` that an invalid status returns `BAD_REQUEST` and that no invitation or answer write is called
- [ ] 5.7 Run lint, typecheck and unit tests, and verify they are clean before opening PR 2

## 6. Transaction runner and query moves (PR 3)

- [ ] 6.1 Add `src/server/infrastructure/database/transaction.ts` with `TransactionRunner` and `RepositoryFactory` (D6), and verify with a unit test that work runs inside one `$transaction` and that repositories receive the tx client
- [ ] 6.2 Move the `event.service.ts` tx queries into `EventRepository` and `InvitationRepository` and inject `TransactionRunner` (D7), and verify the existing `event.service.test.ts` cases (tag-along toggling, scope check) pass
- [ ] 6.3 Move the `communication-log.service.ts` household, invitation and gift queries into `communication-log.repository.ts`, and verify `communication-log.service.test.ts` passes against the repository mock
- [ ] 6.4 Replace `tx.event.findMany` in `household-management.service.ts` with `EventRepository.findIdsByWeddingId` through `TransactionRunner`, and verify the household create tests for default "Not Invited" invites pass
- [ ] 6.5 Add `ChecklistSeedingRepository` and move `checklist-seeding.service.ts` queries into it, and verify the seeding tests pass
- [ ] 6.6 Apply the same change to the remaining services holding `PrismaClient` (`event-management`, `household-invite`, `rsvp-submission`, `self-fill-registration`), and verify with `grep -rl "@prisma/client" src/server --include=*.service.ts` returning nothing and lint passing with the fixed ban from 4.2

## 7. Wedding provisioning (PR 3)

- [ ] 7.1 Add `src/server/application/wedding-provisioning/` (D8) with a test asserting call order (wedding, tags, event when details exist, checklist, Etta), that checklist failure is logged and doesn't fail creation, and that Etta failure doesn't fail creation
- [ ] 7.2 Remove the `EventService` and `GuestTagService` dependencies from `WeddingService`, point `wedding.router.ts` `create` at the provisioning service, and verify `wedding.service.test.ts` and the router tests pass

## 8. Bulk import pre-check (PR 3)

- [ ] 8.1 Add tests for the `household-bulk-import` spec scenarios (foreign event in the last household creates nothing, direct service call is also rejected, non-auth failure counted, missing permission rejected), and verify they fail before the change
- [ ] 8.2 Move the whole-batch event check into `bulkCreateHouseholds` (D9) and delete the router loop and its `eventService` import, and verify the 8.1 tests and `household-management.bulk.test.ts` pass

## 9. Dashboard wiring (PR 3)

- [ ] 9.1 Add `application/dashboard/dashboard.wiring.ts` exporting `dashboardService` and `dashboardOverviewUseCase` (D10), have the router and barrel import from it, and verify the router no longer imports any repository
- [ ] 9.2 Run `npm run build` and load `/dashboard` locally, and verify there's no TDZ or circular import error

## 10. Docs and integration checks (PR 3)

- [ ] 10.1 Update `claude.md` so the domain list matches `src/server/domains`, the reference to `DOMAIN_MIGRATION_PLAN.md` is removed, and the layer table mentions `TransactionRunner` and application-layer provisioning, and verify every path it names exists
- [ ] 10.2 Run `npm run lint`, `npx tsc --noEmit`, `npm run test:unit` and `npm run test:e2e`, and verify all pass before opening PR 3
- [ ] 10.3 Run `openspec validate harden-domain-layer-boundaries --strict` and verify it passes

## Workflow follow-up

- Archive the change once all three PRs are merged.
- Consider the follow-ups in design.md Open Questions (public error masking, Prisma enum for `rsvp`).
