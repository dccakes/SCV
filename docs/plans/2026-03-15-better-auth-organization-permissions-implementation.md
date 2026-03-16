# Better Auth Organization Permissions Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate SCV to Better Auth Organization as the canonical wedding collaboration model and enforce permission-based authorization at use-case/service boundaries across all protected features.

**Architecture:** Treat each wedding as a Better Auth organization, with four roles (`owner`, `admin`, `editor`, `viewer`) mapped to explicit permission resources/actions. Resolve active organization per authenticated request using a single trusted source-of-truth strategy, then enforce two checks at each protected use case: (1) `hasPermission` for action authorization and (2) organization ownership/scope validation for target records to prevent IDOR. Keep repositories focused on data access only, and use idempotent migration scripts to move existing `UserWedding` memberships into Better Auth organization membership.

**Tech Stack:** Next.js 15, tRPC, Better Auth (+ Organization plugin + access control), Prisma 7, PostgreSQL, Jest, Playwright.

---

## File Structure

### New files
- `src/lib/auth-permissions.ts` - Shared Better Auth access-control statements, role definitions, and exported permission constants.
- `src/server/authz/permission-checker.ts` - Central helper for permission checks (`requirePermission`, `requireAnyPermission`) using Better Auth `hasPermission`.
- `src/server/authz/active-organization.ts` - Server helpers for resolving active organization and active member role from session/request headers.
- `src/server/authz/authorization.types.ts` - Canonical authz resource/action TypeScript types used by services.
- `src/server/application/member-management/member-management.service.ts` - Use-case service for org membership/invite/role changes.
- `src/server/application/member-management/index.ts` - Barrel exports for member-management use case.
- `src/server/scripts/migrate-user-weddings-to-organizations.ts` - One-time migration script to create organizations and member assignments from legacy `UserWedding`.
- `tests/unit/auth/auth-permissions.test.ts` - Unit tests for role/action permission matrix.
- `tests/unit/server/authz/permission-checker.test.ts` - Unit tests for authz helpers and denial behavior.
- `tests/unit/application/member-management/member-management.service.test.ts` - Tests for invite/remove/role-update workflows.
- `tests/unit/domains/event/event.permissions.test.ts` - Event + invitation + RSVP permission behavior tests.
- `tests/unit/domains/guest/guest.permissions.test.ts` - Guest/event-assignment permission behavior tests.
- `tests/unit/domains/website/website.permissions.test.ts` - Website security and settings permission behavior tests.
- `tests/e2e/permissions-matrix.spec.ts` - End-to-end role matrix smoke tests.

### Modified files
- `src/lib/auth.ts` - Enable Better Auth organization plugin, wire custom access control and role map.
- `src/lib/auth-client.ts` - Enable `organizationClient` plugin and shared permission model.
- `src/server/api/trpc.ts` - Extend context with active organization/member info; keep authentication responsibility unchanged.
- `prisma/schema.prisma` - Add `Wedding.organizationId` and migration-safe fields/indexes; keep legacy table during transition.
- `src/env.js` - Add rollout env flag(s) and validation for org enforcement toggles.
- `prisma/seed.mjs` - Seed Better Auth organizations + memberships + role assignments.
- `prisma/seed-fixture.json` - Fixture updates for organizations and role scenarios.
- `src/server/domains/event/event.service.ts` - Add permission checks at use-case boundaries.
- `src/server/domains/event/event.repository.ts` - Add organization-scoped lookup helpers used by service ownership guards.
- `src/server/domains/invitation/invitation.service.ts` - Add invitation permission checks (`create/send/resend/cancel`).
- `src/server/domains/invitation/invitation.repository.ts` - Add organization-scoped invitation lookups for scope checks.
- `src/server/application/rsvp-submission/rsvp-submission.service.ts` - Keep public submission boundary; enforce admin-only for protected RSVP management paths.
- `src/server/application/household-management/household-management.service.ts` - Add guest/guest-event permission checks before write actions.
- `src/server/domains/guest/guest.service.ts` - Add read/create/update/delete permission checks.
- `src/server/domains/guest/guest.repository.ts` - Add organization-scoped guest lookups for scope checks.
- `src/server/domains/website/website.service.ts` - Add settings/password/RSVP-policy permission checks.
- `src/server/domains/website/website.repository.ts` - Add organization-scoped website lookups for scope checks.
- `src/server/domains/vendor/vendor.service.ts` - Add vendor and vendor-quote permission checks.
- `src/server/domains/vendor/vendor.repository.ts` - Add organization-scoped vendor/quote lookups where missing.
- `src/server/domains/wedding/wedding.repository.ts` - Add active-organization membership resolution helpers.
- `src/server/domains/event/event.router.ts` - Delegate authz to services and pass context object.
- `src/server/domains/invitation/invitation.router.ts` - Delegate authz to services and pass context object.
- `src/server/domains/guest/guest.router.ts` - Delegate authz to services and pass context object.
- `src/server/domains/household/household.router.ts` - Delegate authz to services and pass context object.
- `src/server/domains/question/question.router.ts` - Delegate authz to services and pass context object.
- `src/server/domains/website/website.router.ts` - Keep public RSVP endpoints public; gate protected mutations by service permissions.
- `src/server/domains/vendor/vendor.router.ts` - Delegate authz to services and pass context object.

## Permission Model (Approved)

- Roles: `owner`, `admin`, `editor`, `viewer`
- Principle: permission-based checks only at use-case/service level (not repository)
- Core resources/actions:
  - `organization_member`: `read`, `invite`, `role_update`, `remove`
  - `invitation`: `read`, `create`, `send`, `resend`, `cancel`
  - `guest_event`: `read`, `add_guest_to_event`, `remove_guest_from_event`
  - `rsvp`: `read_responses`, `edit_response`, `export`, `reopen_submission`
  - `event`: `read`, `create`, `update`, `delete`, `rsvp_policy_update`
  - `guest`: `read`, `create`, `update`, `delete`, `import`
  - `vendor`: `read`, `create`, `update`, `delete`
  - `vendor_quote`: `read`, `create`, `update`, `delete`
  - `website`: `read`, `update`, `publish`, `password_update`
- Special rule: `editor` can add/remove guests from event invites, but cannot send/resend/cancel invitations.
- Public boundary: guest RSVP submission and invitation-response flows remain token/password-gated public endpoints and do not use organization member permissions.

## Chunk 1: Auth Foundation and Permission Contract

### Task 1: Define Shared Access Control Contract

**Files:**
- Create: `src/lib/auth-permissions.ts`
- Test: `tests/unit/auth/auth-permissions.test.ts`

- [ ] **Step 1: Write failing role-matrix tests**

```ts
describe('auth permission matrix', () => {
  it('editor can manage guest event assignment but cannot send invites', () => {
    expect(can('editor', { guest_event: ['add_guest_to_event'] })).toBe(true)
    expect(can('editor', { invitation: ['send'] })).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/auth/auth-permissions.test.ts`
Expected: FAIL with missing module or missing role definitions.

- [ ] **Step 3: Implement permission statements and role grants**

```ts
export const authzStatement = {
  organization_member: ['read', 'invite', 'role_update', 'remove'],
  invitation: ['read', 'create', 'send', 'resend', 'cancel'],
  guest_event: ['read', 'add_guest_to_event', 'remove_guest_from_event'],
  rsvp: ['read_responses', 'edit_response', 'export', 'reopen_submission'],
  event: ['read', 'create', 'update', 'delete', 'rsvp_policy_update'],
  guest: ['read', 'create', 'update', 'delete', 'import'],
  vendor: ['read', 'create', 'update', 'delete'],
  vendor_quote: ['read', 'create', 'update', 'delete'],
  website: ['read', 'update', 'publish', 'password_update'],
} as const
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm run test:unit -- tests/unit/auth/auth-permissions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth-permissions.ts tests/unit/auth/auth-permissions.test.ts
git commit -m "feat(auth): define organization permission contract and role matrix"
```

### Task 2: Wire Better Auth Organization on Server and Client

**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/lib/auth-client.ts`
- Test: `tests/unit/auth/auth-permissions.test.ts`

- [ ] **Step 1: Write failing integration-style auth wiring test**

```ts
it('exports organization roles to server and client plugin config', () => {
  expect(serverHasOrganizationPlugin()).toBe(true)
  expect(clientHasOrganizationPlugin()).toBe(true)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/auth/auth-permissions.test.ts`
Expected: FAIL because plugin wiring is absent.

- [ ] **Step 3: Implement plugin wiring**

```ts
// auth.ts
organization({ ac, roles: { owner, admin, editor, viewer } })

// auth-client.ts
organizationClient({ ac, roles: { owner, admin, editor, viewer } })
```

- [ ] **Step 4: Re-run test**

Run: `npm run test:unit -- tests/unit/auth/auth-permissions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/lib/auth-client.ts tests/unit/auth/auth-permissions.test.ts
git commit -m "feat(auth): enable better-auth organization plugin with custom roles"
```

### Task 3: Build Use-Case Permission Helpers

**Files:**
- Create: `src/server/authz/authorization.types.ts`
- Create: `src/server/authz/active-organization.ts`
- Create: `src/server/authz/permission-checker.ts`
- Modify: `src/server/api/trpc.ts`
- Modify: `src/server/domains/event/event.service.ts`
- Modify: `src/server/domains/invitation/invitation.service.ts`
- Modify: `src/server/domains/guest/guest.service.ts`
- Modify: `src/server/domains/website/website.service.ts`
- Modify: `src/server/domains/vendor/vendor.service.ts`
- Modify: `src/server/application/household-management/household-management.service.ts`
- Modify: `src/server/domains/event/event.router.ts`
- Modify: `src/server/domains/invitation/invitation.router.ts`
- Modify: `src/server/domains/guest/guest.router.ts`
- Modify: `src/server/domains/website/website.router.ts`
- Modify: `src/server/domains/vendor/vendor.router.ts`
- Modify: `src/server/domains/household/household.router.ts`
- Test: `tests/unit/server/authz/permission-checker.test.ts`

- [ ] **Step 1: Write failing helper tests for allow/deny behavior**

```ts
it('throws FORBIDDEN when permission check fails', async () => {
  await expect(requirePermission(ctx, { invitation: ['send'] })).rejects.toMatchObject({ code: 'FORBIDDEN' })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/server/authz/permission-checker.test.ts`
Expected: FAIL with missing helper implementation.

- [ ] **Step 3: Implement active-org resolution and permission helper**

```ts
export async function requirePermission(ctx: AuthzContext, permissions: PermissionInput) {
  const activeOrg = await resolveActiveOrganization(ctx)
  const allowed = await auth.api.hasPermission({ headers: ctx.headers, body: { permissions, organizationId: activeOrg.id } })
  if (!allowed?.success) throw new TRPCError({ code: 'FORBIDDEN' })
  return activeOrg
}
```

- [ ] **Step 3.3: Define active-organization source-of-truth and fallback rules**

```ts
// precedence
// 1) session.activeOrganizationId (if present)
// 2) explicit organizationId input only when member belongs to it
// 3) deterministic fallback: first organization membership by createdAt asc
// invalid/missing => TRPCError({ code: 'PRECONDITION_FAILED' })
```

- [ ] **Step 3.1: Refactor service method signatures to accept authz context**

```ts
type UseCaseContext = { userId: string; headers: Headers; activeOrganizationId?: string }

// before
updateEvent(weddingId: string, input: UpdateEventInput)

// after
updateEvent(ctx: UseCaseContext, input: UpdateEventInput)
```

- [ ] **Step 3.2: Update router call-sites to pass use-case context**

```ts
return eventService.updateEvent(
  { userId: ctx.auth.userId, headers: ctx.headers },
  input,
)
```

- [ ] **Step 4: Run helper tests**

Run: `npm run test:unit -- tests/unit/server/authz/permission-checker.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/authz src/server/api/trpc.ts tests/unit/server/authz/permission-checker.test.ts
git commit -m "feat(authz): add active-organization and permission helper utilities"
```

## Chunk 2: Domain and Use-Case Enforcement

### Task 3.6: Add Organization Ownership Guard Helpers

**Files:**
- Create: `src/server/authz/organization-scope.ts`
- Test: `tests/unit/server/authz/organization-scope.test.ts`

- [ ] **Step 1: Write failing tests for IDOR prevention behavior**

```ts
it('throws FORBIDDEN when target entity is outside active organization', async () => {
  await expect(assertInActiveOrganization(ctx, { entity: 'event', id: eventId })).rejects.toMatchObject({ code: 'FORBIDDEN' })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test:unit -- tests/unit/server/authz/organization-scope.test.ts`
Expected: FAIL with missing ownership guard implementation.

- [ ] **Step 3: Implement reusable scope assertions**

```ts
await assertEventInOrganization(activeOrgId, eventId)
await assertGuestInOrganization(activeOrgId, guestId)
await assertInvitationInOrganization(activeOrgId, invitationId)
```

- [ ] **Step 3.1: Add repository methods for scope checks (no Prisma in services)**

```ts
// repository examples
eventRepository.belongsToOrganization(eventId, organizationId)
guestRepository.belongsToOrganization(guestId, organizationId)
invitationRepository.belongsToOrganization(invitationId, organizationId)
```

- [ ] **Step 4: Re-run tests**

Run: `npm run test:unit -- tests/unit/server/authz/organization-scope.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/authz/organization-scope.ts tests/unit/server/authz/organization-scope.test.ts
git commit -m "feat(authz): add organization ownership guards for target entities"
```

### Task 3.5: Organization Member Management Use Case

**Files:**
- Create: `src/server/application/member-management/member-management.service.ts`
- Create: `src/server/application/member-management/index.ts`
- Test: `tests/unit/application/member-management/member-management.service.test.ts`

- [ ] **Step 1: Write failing tests for invite/remove/role-update permission paths**

```ts
it('allows admin to invite member but denies editor from role updates', async () => {
  await expect(service.inviteMember(adminCtx, input)).resolves.toBeDefined()
  await expect(service.updateMemberRole(editorCtx, roleInput)).rejects.toMatchObject({ code: 'FORBIDDEN' })
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm run test:unit -- tests/unit/application/member-management/member-management.service.test.ts`
Expected: FAIL with missing service implementation.

- [ ] **Step 3: Implement member management use case with permission helper**

```ts
await requirePermission(ctx, { organization_member: ['invite'] })
await requirePermission(ctx, { organization_member: ['role_update'] })
await requirePermission(ctx, { organization_member: ['remove'] })
```

- [ ] **Step 4: Re-run tests**

Run: `npm run test:unit -- tests/unit/application/member-management/member-management.service.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/application/member-management tests/unit/application/member-management/member-management.service.test.ts
git commit -m "feat(authz): add organization member management use case"
```

### Task 4: Event, Invitation, and RSVP Authorization

**Files:**
- Modify: `src/server/domains/event/event.service.ts`
- Modify: `src/server/domains/invitation/invitation.service.ts`
- Modify: `src/server/application/rsvp-submission/rsvp-submission.service.ts`
- Test: `tests/unit/domains/event/event.permissions.test.ts`

- [ ] **Step 1: Write failing behavior tests for role-sensitive event/invite actions**

```ts
it('allows editor to add guest to event but denies sending invitation', async () => {
  await expect(service.addGuestToEvent(editorCtx, input)).resolves.toBeDefined()
  await expect(service.sendInvitation(editorCtx, input)).rejects.toMatchObject({ code: 'FORBIDDEN' })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test:unit -- tests/unit/domains/event/event.permissions.test.ts`
Expected: FAIL with missing permission guards.

- [ ] **Step 3: Add permission checks in service entry points**

```ts
await requirePermission(ctx, { guest_event: ['add_guest_to_event'] })
await requirePermission(ctx, { invitation: ['send'] })
```

- [ ] **Step 3.1: Keep public RSVP submission boundary explicitly unchanged**

```ts
// Public token flow remains public
submitPublicRsvpForm(input) // no org-member permission check

// Protected management flow requires permission
await requirePermission(ctx, { rsvp: ['read_responses'] })
```

- [ ] **Step 4: Re-run test**

Run: `npm run test:unit -- tests/unit/domains/event/event.permissions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/domains/event/event.service.ts src/server/domains/invitation/invitation.service.ts src/server/application/rsvp-submission/rsvp-submission.service.ts tests/unit/domains/event/event.permissions.test.ts
git commit -m "feat(authz): enforce permissions for event, invitation, and RSVP workflows"
```

### Task 5: Guest and Household Authorization

**Files:**
- Modify: `src/server/domains/guest/guest.service.ts`
- Modify: `src/server/application/household-management/household-management.service.ts`
- Test: `tests/unit/domains/guest/guest.permissions.test.ts`

- [ ] **Step 1: Write failing guest/household permission tests**

```ts
it('denies viewer guest mutation actions', async () => {
  await expect(service.updateGuest(viewerCtx, input)).rejects.toMatchObject({ code: 'FORBIDDEN' })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test:unit -- tests/unit/domains/guest/guest.permissions.test.ts`
Expected: FAIL.

- [ ] **Step 3: Add `guest` and `guest_event` permission checks to use-case methods**

```ts
await requirePermission(ctx, { guest: ['update'] })
await requirePermission(ctx, { guest_event: ['remove_guest_from_event'] })
```

- [ ] **Step 4: Re-run tests**

Run: `npm run test:unit -- tests/unit/domains/guest/guest.permissions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/domains/guest/guest.service.ts src/server/application/household-management/household-management.service.ts tests/unit/domains/guest/guest.permissions.test.ts
git commit -m "feat(authz): enforce guest and household permission boundaries"
```

### Task 6: Website, Vendor, and Security-Sensitive Settings Authorization

**Files:**
- Modify: `src/server/domains/website/website.service.ts`
- Modify: `src/server/domains/vendor/vendor.service.ts`
- Test: `tests/unit/domains/website/website.permissions.test.ts`

- [ ] **Step 1: Write failing tests for password/settings/admin-only behaviors**

```ts
it('denies editor password update but allows website content updates', async () => {
  await expect(service.updatePassword(editorCtx, input)).rejects.toMatchObject({ code: 'FORBIDDEN' })
  await expect(service.updateWebsite(editorCtx, contentInput)).resolves.toBeDefined()
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm run test:unit -- tests/unit/domains/website/website.permissions.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `website.password_update`, `website.publish`, `vendor*` permission guards**

```ts
await requirePermission(ctx, { website: ['password_update'] })
await requirePermission(ctx, { vendor_quote: ['update'] })
```

- [ ] **Step 4: Re-run tests**

Run: `npm run test:unit -- tests/unit/domains/website/website.permissions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/domains/website/website.service.ts src/server/domains/vendor/vendor.service.ts tests/unit/domains/website/website.permissions.test.ts
git commit -m "feat(authz): enforce permissions for website security and vendor workflows"
```

## Chunk 3: Data Migration, Seed, and End-to-End Validation

### Task 7: Schema and Migration for Organization Linkage

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/migrations/*` (new migration)
- Modify: Better Auth migration output (organization tables) generated by CLI

- [ ] **Step 1: Write failing repository/service tests that require `Wedding.organizationId` presence**

```ts
it('requires wedding to be linked to organization before protected write', async () => {
  await expect(service.updateWedding(ctxWithoutOrgLink, input)).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' })
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm run test:unit -- tests/unit/domains/wedding/wedding.service.test.ts`
Expected: FAIL.

- [ ] **Step 3: Add schema fields and generate migration**

Run: `npx prisma migrate dev --name add_wedding_organization_link`
Expected: Migration created and Prisma client generated.

- [ ] **Step 3.1: Generate Better Auth organization tables**

Run: `npx auth migrate`
Expected: Organization, member, and invitation auth tables are present and migrated.

- [ ] **Step 4: Re-run relevant tests**

Run: `npm run test:unit -- tests/unit/domains/wedding/wedding.service.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): link weddings to better-auth organizations"
```

### Task 8: Membership Backfill Script and Seed Updates

**Files:**
- Create: `src/server/scripts/migrate-user-weddings-to-organizations.ts`
- Modify: `prisma/seed.mjs`
- Modify: `prisma/seed-fixture.json`
- Test: `tests/unit/application/member-management/member-management.service.test.ts`

- [ ] **Step 1: Write failing migration/seed behavior tests**

```ts
it('maps legacy userWedding roles to organization member roles', async () => {
  expect(mapLegacyRole('owner')).toBe('owner')
  expect(mapLegacyRole('editor')).toBe('editor')
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm run test:unit -- tests/unit/application/member-management/member-management.service.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement migration script and seed update logic**

Run: `node --loader ts-node/esm src/server/scripts/migrate-user-weddings-to-organizations.ts --dry-run`
Expected: Dry-run output lists organization/member records to create with no writes.

- [ ] **Step 3.1: Add idempotency and transaction safety guarantees**

```ts
// requirements
// - upsert organization by weddingId slug/key
// - upsert member by (organizationId, userId)
// - wrap each wedding migration in a transaction
// - resumable cursor/checkpoint output for restart safety
```

- [ ] **Step 4: Re-run tests after implementation**

Run: `npm run test:unit -- tests/unit/application/member-management/member-management.service.test.ts`
Expected: PASS.

- [ ] **Step 5: Execute non-dry run in local dev database and verify**

Run: `node --loader ts-node/esm src/server/scripts/migrate-user-weddings-to-organizations.ts`
Expected: Organizations and memberships created; wedding links backfilled.

- [ ] **Step 6: Commit**

```bash
git add src/server/scripts/migrate-user-weddings-to-organizations.ts prisma/seed.mjs prisma/seed-fixture.json tests/unit/application/member-management/member-management.service.test.ts
git commit -m "feat(migration): backfill wedding memberships into better-auth organizations"
```

### Task 9: Router Cleanup and End-to-End Permission Matrix

**Files:**
- Modify: `src/server/domains/event/event.router.ts`
- Modify: `src/server/domains/invitation/invitation.router.ts`
- Modify: `src/server/domains/guest/guest.router.ts`
- Modify: `src/server/domains/household/household.router.ts`
- Modify: `src/server/domains/question/question.router.ts`
- Modify: `src/server/domains/website/website.router.ts`
- Modify: `src/server/domains/vendor/vendor.router.ts`
- Test: `tests/e2e/permissions-matrix.spec.ts`

- [ ] **Step 1: Write failing E2E tests for role matrix critical flows**

```ts
test('editor can add guest to event but cannot send invite', async ({ page }) => {
  // Setup and assertions for allowed + forbidden flows
})
```

- [ ] **Step 2: Run E2E test to verify failure**

Run: `npm run test:e2e -- tests/e2e/permissions-matrix.spec.ts`
Expected: FAIL with unauthorized behavior mismatches.

- [ ] **Step 3: Clean routers to delegate permission checks to services only**

```ts
// Router keeps input validation + auth + delegation only
return eventService.sendInvitation(ctx, input)
```

- [ ] **Step 4: Run full quality gates**

Run: `npm run test:unit`
Expected: PASS.

Run: `npm run test:e2e -- tests/e2e/permissions-matrix.spec.ts`
Expected: PASS.

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/domains tests/e2e/permissions-matrix.spec.ts
git commit -m "feat(authz): enforce use-case permission model across protected routers"
```

## Rollout and Safety Checklist

- [ ] Add feature flag: `BETTER_AUTH_ORG_ENFORCEMENT=true` for staged rollout.
- [ ] Add and validate env vars in `src/env.js` for org-enforcement and migration mode.
- [ ] Run migration script in dry-run and capture output artifact.
- [ ] Run migration on local/dev and verify counts match legacy membership records.
- [ ] Verify owner/admin/editor/viewer critical scenarios manually in app.
- [ ] Confirm all previously vulnerable ID-based mutation routes now enforce BOTH org scope and permission checks.
- [ ] Remove legacy `UserWedding` runtime reads after two green releases.

## Definition of Done

- [ ] Better Auth Organization plugin is the canonical membership source for protected app behavior.
- [ ] All protected use cases enforce permission-based checks and organization-scope checks through centralized helpers.
- [ ] `editor` can manage event guest assignment but cannot send invitations.
- [ ] `admin` and `owner` can send/resend/cancel invitations.
- [ ] Seed + migration scripts support local bootstrap and legacy data backfill.
- [ ] Unit, integration, and E2E permission matrix tests pass.
