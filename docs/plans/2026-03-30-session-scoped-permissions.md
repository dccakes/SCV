# Session-Scoped Permissions Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the per-call Better Auth API round-trips for permission checking with a single membership lookup at request context time, so that the active organization and user role are available directly from `ctx.auth` — making `requirePermission` a pure synchronous function with zero extra DB queries.

**Architecture:** `createTRPCContext` runs `auth.api.getSession` (already present) and a parallel `db.$queryRaw` to fetch the active member's role from the Better Auth `member` table. The result is stored as `ctx.auth.activeOrganization: { organizationId, role } | null`. `requirePermission` becomes a pure synchronous function that reads the role from context and calls `organizationRoles[role].authorize(permissions)` directly — no network calls, no `listOrganizations`, no `auth.api.hasPermission`. `active-organization.ts` is deleted. `AuthzContext` drops `headers` (only needed for the old API calls) and gains `activeOrganization`.

**Tech Stack:** Next.js 15, tRPC, Better Auth (organization plugin), Prisma, Jest, TypeScript strict mode.

---

## Background: Why the Current Approach Is Expensive

The current flow per permission check:
1. `auth.api.listOrganizations({ headers })` → DB query to fetch all org memberships
2. `auth.api.hasPermission({ headers, body })` → DB query `findMemberByOrgId` to get role, then pure in-memory check

The actual permission check (`role.authorize(permissions)`) is pure in-memory against the static `organizationRoles` map in `auth-permissions.ts`. The only reason we hit the DB is to learn what role the user holds. Since the session cookie already gives us `activeOrganizationId`, we just need the role — once, at context creation.

---

## File Structure

### Files to delete
- `src/server/authz/active-organization.ts` — replaced by context-time lookup
- `tests/unit/server/authz/organization-scope.test.ts` — update: only the active-org resolution tests go away; org-scope IDOR helpers stay

### Files to modify
- `src/server/api/trpc.ts` — parallel-fetch active member at context time; add `activeOrganization` to `ctx.auth`
- `src/server/authz/authorization.types.ts` — replace `headers` + `sessionActiveOrganizationId` with `activeOrganization` in `AuthzContext`; update `toAuthzContext`
- `src/server/authz/permission-checker.ts` — rewrite `requirePermission` as pure sync function; delete `active-organization` import
- `src/server/authz/organization-scope.ts` — remove the `EventWeddingScopeRepository`/`InvitationWeddingScopeRepository` interfaces and their assert functions (these were the old user-scoped checks now replaced by org checks); keep `assertEventInActiveOrganization`, `assertGuestInActiveOrganization`, `assertInvitationInActiveOrganization`
- `src/server/infrastructure/database/__mocks__/client.ts` — add `mockMemberFindFirst` for the new context lookup
- `tests/unit/server/trpc-context-authz.test.ts` — update to test that active member role is fetched at context time
- `tests/unit/server/authz/permission-checker.test.ts` — rewrite tests: no longer mock `auth.api.*`, test pure sync behavior
- All service test files that mock `requirePermission` — update `createCtx` helper to include `activeOrganization`

### Files unaffected
- `src/lib/auth-permissions.ts` — no change to role matrix
- `src/lib/auth.ts` / `src/lib/auth-client.ts` — no change
- All router files — `toAuthzContext(ctx)` call signature changes but all callers pass the same `ctx`; the change is transparent
- `src/server/authz/organization-scope.ts` — IDOR helpers (`assertEventInActiveOrganization` etc.) are unchanged

---

## Task 1: Fetch Active Member Role at Context Time

Update `createTRPCContext` to run a parallel `$queryRaw` for the active member alongside `getSession`. Store the result as `ctx.auth.activeOrganization`.

**Files:**
- Modify: `src/server/api/trpc.ts`
- Modify: `src/server/infrastructure/database/__mocks__/client.ts`
- Modify: `tests/unit/server/trpc-context-authz.test.ts`

- [ ] **Step 1: Write failing tests for new context shape**

Open `tests/unit/server/trpc-context-authz.test.ts` and replace the entire file with:

```typescript
jest.mock('lib/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}))

jest.mock('server/db', () => ({
  db: {
    id: 'mock-db',
    $queryRaw: jest.fn(),
  },
}))

import { auth } from 'lib/auth'
import { db } from 'server/db'
import { createTRPCContext } from 'server/api/trpc'

const mockGetSession = auth.api.getSession as jest.Mock
const mockQueryRaw = db.$queryRaw as unknown as jest.Mock

describe('createTRPCContext active organization resolution', () => {
  beforeEach(() => {
    mockGetSession.mockReset()
    mockQueryRaw.mockReset()
  })

  it('populates activeOrganization when session has activeOrganizationId and member exists', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
      session: { activeOrganizationId: 'org-1' },
    })
    mockQueryRaw.mockResolvedValue([{ role: 'admin' }])

    const context = await createTRPCContext({ headers: new Headers() })

    expect(context.auth.activeOrganization).toEqual({
      organizationId: 'org-1',
      role: 'admin',
    })
  })

  it('sets activeOrganization to null when no activeOrganizationId in session', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
      session: {},
    })

    const context = await createTRPCContext({ headers: new Headers() })

    expect(context.auth.activeOrganization).toBeNull()
    expect(mockQueryRaw).not.toHaveBeenCalled()
  })

  it('sets activeOrganization to null when member record is not found', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
      session: { activeOrganizationId: 'org-1' },
    })
    mockQueryRaw.mockResolvedValue([])

    const context = await createTRPCContext({ headers: new Headers() })

    expect(context.auth.activeOrganization).toBeNull()
  })

  it('sets activeOrganization to null when session is null (unauthenticated)', async () => {
    mockGetSession.mockResolvedValue(null)

    const context = await createTRPCContext({ headers: new Headers() })

    expect(context.auth.activeOrganization).toBeNull()
    expect(mockQueryRaw).not.toHaveBeenCalled()
  })

  it('preserves userId in auth context', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-42' },
      session: {},
    })

    const context = await createTRPCContext({ headers: new Headers() })

    expect(context.auth.userId).toBe('user-42')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/diegocarvallo/Documents/diego-personal/SCV-worktrees/feat-add-multi-user-permissions
npm run test:unit -- tests/unit/server/trpc-context-authz.test.ts
```

Expected: FAIL — `context.auth.activeOrganization` is undefined.

- [ ] **Step 3: Update `createTRPCContext` in `src/server/api/trpc.ts`**

Replace the entire file content with:

```typescript
/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { auth } from '~/lib/auth'
import { db } from '~/server/db'

type ActiveOrganization = {
  organizationId: string
  role: string | null
}

const getSessionActiveOrganizationId = (session: unknown): string | null => {
  if (!session || typeof session !== 'object') {
    return null
  }

  const sessionRecord =
    'session' in session && typeof session.session === 'object' && session.session !== null
      ? (session.session as Record<string, unknown>)
      : null

  if (!sessionRecord) {
    return null
  }

  const activeOrganizationId = sessionRecord.activeOrganizationId
  if (typeof activeOrganizationId === 'string' && activeOrganizationId.length > 0) {
    return activeOrganizationId
  }

  const activeOrganization =
    typeof sessionRecord.activeOrganization === 'object' &&
    sessionRecord.activeOrganization !== null
      ? (sessionRecord.activeOrganization as Record<string, unknown>)
      : null

  const nestedOrganizationId = activeOrganization?.id
  if (typeof nestedOrganizationId === 'string' && nestedOrganizationId.length > 0) {
    return nestedOrganizationId
  }

  return null
}

const fetchActiveMember = async (
  userId: string,
  organizationId: string
): Promise<ActiveOrganization | null> => {
  const rows = await db.$queryRaw<Array<{ role: string }>>`
    SELECT "role"
    FROM "member"
    WHERE "userId" = ${userId}
      AND "organizationId" = ${organizationId}
    LIMIT 1
  `

  const row = rows[0]
  if (!row) return null

  return { organizationId, role: row.role }
}

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({
    headers: opts.headers,
  })

  const userId = session?.user?.id ?? null
  const sessionActiveOrganizationId = getSessionActiveOrganizationId(session)

  const activeOrganization: ActiveOrganization | null =
    userId && sessionActiveOrganizationId
      ? await fetchActiveMember(userId, sessionActiveOrganizationId)
      : null

  return {
    db,
    auth: {
      userId,
      session: session,
      activeOrganization,
    },
    ...opts,
  }
}

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.auth?.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      auth: { ...ctx.auth, userId: ctx.auth.userId },
    },
  })
})
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:unit -- tests/unit/server/trpc-context-authz.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/api/trpc.ts tests/unit/server/trpc-context-authz.test.ts
git commit -m "feat(authz): fetch active member role once at tRPC context creation"
```

---

## Task 2: Simplify AuthzContext and toAuthzContext

Update `authorization.types.ts` so `AuthzContext` carries `activeOrganization` instead of `headers` + `sessionActiveOrganizationId`. Update `toAuthzContext` to pull from the new context shape.

**Files:**
- Modify: `src/server/authz/authorization.types.ts`

- [ ] **Step 1: Write failing compilation check**

The type change will cause TypeScript errors in files that still construct `AuthzContext` with `headers`. We'll use the build as our "test":

```bash
npm run lint
```

Expected: passes currently. After the edit below, running `npm run lint` will surface errors in callers — that's our red step.

- [ ] **Step 2: Update `authorization.types.ts`**

Replace the entire file:

```typescript
export type PermissionInput = Record<string, readonly string[]>

export type ActiveOrganization = {
  organizationId: string
  role: string | null
}

export type AuthzContext = {
  userId: string
  activeOrganization: ActiveOrganization | null
}

export const toAuthzContext = (ctx: {
  auth: {
    userId: string
    activeOrganization: ActiveOrganization | null
  }
}): AuthzContext => ({
  userId: ctx.auth.userId,
  activeOrganization: ctx.auth.activeOrganization,
})
```

Note: `OrganizationMembership` and `ResolveActiveOrganizationOptions` are no longer needed and are removed. `ActiveOrganization` is kept here and re-exported to avoid duplicate declarations.

- [ ] **Step 3: Verify lint now reports errors in callers that use the old shape**

```bash
npm run lint 2>&1 | grep "authorization.types\|authz"
```

Expected: TypeScript errors in `active-organization.ts`, `permission-checker.ts`, and test files that build `AuthzContext` manually. These will be fixed in the next tasks.

- [ ] **Step 4: Commit the type change alone**

```bash
git add src/server/authz/authorization.types.ts
git commit -m "refactor(authz): simplify AuthzContext to carry activeOrganization directly"
```

---

## Task 3: Rewrite requirePermission as a Pure Synchronous Function

`requirePermission` no longer needs to call `listOrganizations` or `auth.api.hasPermission`. It reads `ctx.activeOrganization` and calls `organizationRoles[role].authorize(permissions)` directly.

**Files:**
- Modify: `src/server/authz/permission-checker.ts`
- Delete: `src/server/authz/active-organization.ts`
- Modify: `tests/unit/server/authz/permission-checker.test.ts`

- [ ] **Step 1: Write failing tests for the new pure implementation**

Replace `tests/unit/server/authz/permission-checker.test.ts` entirely:

```typescript
import { TRPCError } from '@trpc/server'
import { requirePermission } from 'server/authz/permission-checker'
import type { AuthzContext } from 'server/authz/authorization.types'

const ownerCtx: AuthzContext = {
  userId: 'user-1',
  activeOrganization: { organizationId: 'org-1', role: 'owner' },
}

const adminCtx: AuthzContext = {
  userId: 'user-2',
  activeOrganization: { organizationId: 'org-1', role: 'admin' },
}

const editorCtx: AuthzContext = {
  userId: 'user-3',
  activeOrganization: { organizationId: 'org-1', role: 'editor' },
}

const viewerCtx: AuthzContext = {
  userId: 'user-4',
  activeOrganization: { organizationId: 'org-1', role: 'viewer' },
}

const noOrgCtx: AuthzContext = {
  userId: 'user-5',
  activeOrganization: null,
}

describe('requirePermission', () => {
  it('returns activeOrganization when permission is granted', () => {
    const result = requirePermission(ownerCtx, { event: ['create'] })
    expect(result).toEqual({ organizationId: 'org-1', role: 'owner' })
  })

  it('throws FORBIDDEN when viewer attempts a write action', () => {
    expect(() => requirePermission(viewerCtx, { event: ['create'] })).toThrow(
      expect.objectContaining({ code: 'FORBIDDEN' })
    )
  })

  it('throws FORBIDDEN when editor attempts invitation send', () => {
    expect(() => requirePermission(editorCtx, { invitation: ['send'] })).toThrow(
      expect.objectContaining({ code: 'FORBIDDEN' })
    )
  })

  it('allows editor to add guests to events', () => {
    expect(() =>
      requirePermission(editorCtx, { guest_event: ['add_guest_to_event'] })
    ).not.toThrow()
  })

  it('allows admin to send invitations', () => {
    expect(() => requirePermission(adminCtx, { invitation: ['send'] })).not.toThrow()
  })

  it('throws PRECONDITION_FAILED when no active organization in context', () => {
    expect(() => requirePermission(noOrgCtx, { event: ['create'] })).toThrow(
      expect.objectContaining({ code: 'PRECONDITION_FAILED' })
    )
  })

  it('throws FORBIDDEN for unknown role', () => {
    const unknownRoleCtx: AuthzContext = {
      userId: 'user-x',
      activeOrganization: { organizationId: 'org-1', role: 'superuser' },
    }
    expect(() => requirePermission(unknownRoleCtx, { event: ['read'] })).toThrow(
      expect.objectContaining({ code: 'FORBIDDEN' })
    )
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:unit -- tests/unit/server/authz/permission-checker.test.ts
```

Expected: FAIL — `requirePermission` is still async and uses old signature.

- [ ] **Step 3: Rewrite `src/server/authz/permission-checker.ts`**

Replace the entire file:

```typescript
import { TRPCError } from '@trpc/server'

import { organizationRoles } from '~/lib/auth-permissions'
import type { ActiveOrganization, AuthzContext, PermissionInput } from '~/server/authz/authorization.types'

export const requirePermission = (
  ctx: AuthzContext,
  permissions: PermissionInput
): ActiveOrganization => {
  if (!ctx.activeOrganization) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'No active organization in session',
    })
  }

  const { role, organizationId } = ctx.activeOrganization
  const roleKey = role as keyof typeof organizationRoles

  if (!role || !(roleKey in organizationRoles)) {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }

  const result = organizationRoles[roleKey].authorize(permissions)

  if (!result.success) {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }

  return { organizationId, role }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:unit -- tests/unit/server/authz/permission-checker.test.ts
```

Expected: PASS.

- [ ] **Step 5: Delete `active-organization.ts`**

```bash
rm src/server/authz/active-organization.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/server/authz/permission-checker.ts tests/unit/server/authz/permission-checker.test.ts
git rm src/server/authz/active-organization.ts
git commit -m "refactor(authz): make requirePermission a pure sync function, remove listOrganizations round-trip"
```

---

## Task 4: Fix All Callers of requirePermission (Services + MemberManagement)

`requirePermission` is now synchronous. All callers that used `await requirePermission(...)` must drop the `await`. The `AuthzContext` no longer has `headers`, so any place that passed `headers` to construct it will need updating via `toAuthzContext`.

**Files:**
- Modify: `src/server/domains/event/event.service.ts`
- Modify: `src/server/domains/invitation/invitation.service.ts`
- Modify: `src/server/domains/guest/guest.service.ts`
- Modify: `src/server/domains/website/website.service.ts`
- Modify: `src/server/domains/vendor/vendor.service.ts`
- Modify: `src/server/domains/wedding/wedding.service.ts`
- Modify: `src/server/domains/gift/gift.service.ts`
- Modify: `src/server/domains/question/question.service.ts`
- Modify: `src/server/domains/guest-tag/guest-tag.service.ts`
- Modify: `src/server/application/household-management/household-management.service.ts`
- Modify: `src/server/application/rsvp-submission/rsvp-submission.service.ts`
- Modify: `src/server/application/member-management/member-management.service.ts`

- [ ] **Step 1: Run all unit tests before touching anything**

```bash
npm run test:unit
```

Expected: some tests fail due to Task 3 type changes. Note the count.

- [ ] **Step 2: Fix `event.service.ts` — drop `await` from `requirePermission` calls and update `requireEventPermission` return type**

In `src/server/domains/event/event.service.ts`:

Find and update the private helper and all call sites:

```typescript
// Change the return type of the private helper
private requireEventPermission(
  ctx: AuthzContext,
  action: 'create' | 'update' | 'delete' | 'rsvp_policy_update'
): ActiveOrganization {
  return requirePermission(ctx, {
    event: [action],
  })
}
```

Also remove `async` from `requireEventPermission` and remove all `await` prefixes on its call sites:

```typescript
// Before:
await this.requireEventPermission(ctx, 'create')
// After:
this.requireEventPermission(ctx, 'create')
```

Apply the same pattern for all four call sites: `createEvent`, `updateEvent`, `updateCollectRsvp`, `deleteEvent`.

- [ ] **Step 3: Fix remaining services — pattern is identical for each**

For each of the following files, find every `await requirePermission(` call and remove the `await`:

- `src/server/domains/invitation/invitation.service.ts`
- `src/server/domains/guest/guest.service.ts`
- `src/server/domains/website/website.service.ts`
- `src/server/domains/vendor/vendor.service.ts`
- `src/server/domains/wedding/wedding.service.ts`
- `src/server/domains/gift/gift.service.ts`
- `src/server/domains/question/question.service.ts`
- `src/server/domains/guest-tag/guest-tag.service.ts`
- `src/server/application/household-management/household-management.service.ts`
- `src/server/application/rsvp-submission/rsvp-submission.service.ts`

Also update any private helper methods that were `async` only because of `requirePermission` — drop their `async`/`await` and fix return types from `Promise<ActiveOrganization>` to `ActiveOrganization`.

- [ ] **Step 4: Fix `member-management.service.ts` — `assertHasOrganizationMemberPermission` was async**

In `src/server/application/member-management/member-management.service.ts`:

```typescript
// Before:
private async assertHasOrganizationMemberPermission(
  ctx: AuthzContext,
  organizationId: string,
  action: OrganizationMemberAction
): Promise<void> {
  await requirePermission(ctx, { organization_member: [action] }, { organizationId })
}

// After:
private assertHasOrganizationMemberPermission(
  ctx: AuthzContext,
  action: OrganizationMemberAction
): void {
  requirePermission(ctx, { organization_member: [action] })
}
```

Note: `organizationId` option is no longer needed — the active org is already in context. Update callers in the same file:

```typescript
async inviteMember(ctx: AuthzContext, input: InviteMemberCommand): Promise<unknown> {
  this.assertHasOrganizationMemberPermission(ctx, 'invite')
  return this.memberRepository.inviteMember(input)
}

async updateMemberRole(ctx: AuthzContext, input: UpdateMemberRoleCommand): Promise<unknown> {
  this.assertHasOrganizationMemberPermission(ctx, 'role_update')
  return this.memberRepository.updateMemberRole(input)
}

async removeMember(ctx: AuthzContext, input: RemoveMemberCommand): Promise<void> {
  this.assertHasOrganizationMemberPermission(ctx, 'remove')
  await this.memberRepository.removeMember(input)
}
```

- [ ] **Step 5: Run all unit tests**

```bash
npm run test:unit
```

Expected: PASS on all 958+ tests (TypeScript async/await signature mismatches in tests will surface here — fix each one following the same pattern: remove `await` from `requirePermission` mock calls in `createCtx` helpers).

- [ ] **Step 6: Commit**

```bash
git add src/server/domains src/server/application
git commit -m "refactor(authz): drop await from requirePermission calls — now sync"
```

---

## Task 5: Update All Test createCtx Helpers to Use New AuthzContext Shape

Every service test that builds an `AuthzContext` manually (via `createCtx` or inline) needs to switch from `{ headers, sessionActiveOrganizationId }` to `{ activeOrganization }`.

**Files:**
- Modify: `tests/unit/server/authz/organization-scope.test.ts`
- Modify: `tests/unit/application/member-management/member-management.service.test.ts`
- Modify: `tests/unit/domains/event/event.service.test.ts`
- Modify: `tests/unit/domains/invitation/invitation.service.test.ts`
- Modify: `tests/unit/domains/guest/guest.service.test.ts`
- Modify: `tests/unit/domains/website/website.service.test.ts`
- Modify: `tests/unit/domains/vendor/vendor.service.test.ts`
- Modify: `tests/unit/domains/wedding/wedding.service.test.ts`
- Modify: `tests/unit/domains/gift/gift.service.test.ts`
- Modify: `tests/unit/domains/question/question.service.test.ts`
- Modify: `tests/unit/domains/guest-tag/guest-tag.service.test.ts`
- Modify: `tests/unit/application/household-management/household-management.service.test.ts`
- Modify: `tests/unit/application/rsvp-submission/rsvp-submission.service.test.ts`

- [ ] **Step 1: Run unit tests to see which test files are failing**

```bash
npm run test:unit 2>&1 | grep "FAIL\|● "
```

Expected: multiple test files failing due to `AuthzContext` shape mismatch.

- [ ] **Step 2: Fix the `createCtx` pattern in each failing test**

The pattern is the same across all files. Find every `createCtx` helper or inline context object and apply this replacement:

```typescript
// Before:
const createCtx = (overrides?: { sessionActiveOrganizationId?: string | null }) => ({
  headers: new Headers(),
  userId: 'user-1',
  sessionActiveOrganizationId: overrides?.sessionActiveOrganizationId ?? 'org-1',
})

// After:
const createCtx = (overrides?: {
  role?: string | null
  organizationId?: string
}) => ({
  userId: 'user-1',
  activeOrganization: {
    organizationId: overrides?.organizationId ?? 'org-1',
    role: overrides?.role ?? 'owner',
  },
})

// For tests that need no active org:
const noOrgCtx = {
  userId: 'user-1',
  activeOrganization: null,
}
```

- [ ] **Step 3: Run all unit tests**

```bash
npm run test:unit
```

Expected: PASS on all tests.

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add tests/
git commit -m "test(authz): update all test ctx helpers to use session-scoped activeOrganization"
```

---

## Task 6: Remove Unused Organization-Resolution Infrastructure

Clean up files and types that existed solely to support the old `listOrganizations` + `hasPermission` API call pattern.

**Files:**
- Delete: `src/server/authz/active-organization.ts` (already done in Task 3, confirm gone)
- Modify: `src/server/authz/authorization.types.ts` — confirm `OrganizationMembership` and `ResolveActiveOrganizationOptions` are removed (done in Task 2)
- Modify: `src/server/authz/organization-scope.ts` — remove the legacy user-scoped helpers (`assertEventInWeddingScope`, `assertEventInUserScope`, `assertInvitationInWeddingScope`, `assertInvitationInUserScope`) and their supporting interfaces (`EventWeddingScopeRepository`, `InvitationWeddingScopeRepository`) if they are no longer called anywhere
- Remove: `tests/unit/server/authz/organization-scope.test.ts` tests that covered `resolveActiveOrganization` (those are gone); keep tests for `assertEventInActiveOrganization`, `assertGuestInActiveOrganization`, `assertInvitationInActiveOrganization`

- [ ] **Step 1: Check which organization-scope helpers are still in use**

```bash
grep -rn "assertEventInWeddingScope\|assertEventInUserScope\|assertInvitationInWeddingScope\|assertInvitationInUserScope\|EventWeddingScopeRepository\|InvitationWeddingScopeRepository" src/
```

Expected: only used in `event.service.ts` and `invitation.service.ts`. If still present there, they are legacy and will be replaced by org-scope checks in a future task when those features are built out. Remove them from services now and keep the org-scope variants.

- [ ] **Step 2: Remove unused helpers from `organization-scope.ts`**

Remove from `src/server/authz/organization-scope.ts`:
- The `EventWeddingScopeRepository` interface (lines containing `belongsToWedding`, `belongsToUser` on event)
- The `InvitationWeddingScopeRepository` interface
- The `assertEventInWeddingScope` function
- The `assertEventInUserScope` function
- The `assertInvitationInWeddingScope` function
- The `assertInvitationInUserScope` function
- The `weddingPermissionDenied` and `userPermissionDenied` helper functions (only used by removed helpers)

Keep: `assertEntityInActiveOrganization`, `assertEventInActiveOrganization`, `assertGuestInActiveOrganization`, `assertInvitationInActiveOrganization`, and their supporting interfaces.

- [ ] **Step 3: Remove calls to deleted helpers in services**

```bash
grep -rn "assertEventInWeddingScope\|assertEventInUserScope\|assertInvitationInWeddingScope\|assertInvitationInUserScope" src/
```

Remove any `import` and `await` call sites for these in `event.service.ts` and `invitation.service.ts`.

- [ ] **Step 4: Run all unit tests**

```bash
npm run test:unit
```

Expected: PASS.

- [ ] **Step 5: Run lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/server/authz/ tests/unit/server/authz/
git commit -m "refactor(authz): remove listOrganizations-era infrastructure and unused scope helpers"
```

---

## Task 7: Update the db Mock to Include Member Query

The `createTRPCContext` now calls `db.$queryRaw` for the member lookup. Tests that use `createTRPCContext` directly need `$queryRaw` mocked.

**Files:**
- Modify: `src/server/infrastructure/database/__mocks__/client.ts`

- [ ] **Step 1: Write failing test that exercises context creation with the mock**

```bash
npm run test:unit -- tests/unit/server/trpc-context-authz.test.ts
```

Expected: This test already passes from Task 1 (we mocked `db.$queryRaw` inline). If any router-level tests also invoke `createTRPCContext`, they may fail because `db.$queryRaw` returns undefined.

```bash
npm run test:unit 2>&1 | grep "queryRaw\|FAIL"
```

- [ ] **Step 2: Add `mockMemberQueryRaw` to the db mock**

In `src/server/infrastructure/database/__mocks__/client.ts`, add after the existing mock declarations:

```typescript
export const mockMemberQueryRaw = jest.fn()
```

Add to the `db` object:

```typescript
export const db = {
  ...dbModels,
  $transaction: mock$transaction,
  $queryRaw: mockMemberQueryRaw,
  $executeRaw: jest.fn(),
} as unknown as PrismaClient
```

Add to the `resetMocks` function:

```typescript
mockMemberQueryRaw.mockReset()
```

- [ ] **Step 3: Run all unit tests**

```bash
npm run test:unit
```

Expected: PASS on all tests.

- [ ] **Step 4: Commit**

```bash
git add src/server/infrastructure/database/__mocks__/client.ts
git commit -m "test(mock): add $queryRaw and $executeRaw to db mock for member lookup"
```

---

## Task 8: Final Verification

- [ ] **Step 1: Run the full unit test suite**

```bash
npm run test:unit
```

Expected: all tests pass.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: successful build with no TypeScript errors.

- [ ] **Step 4: Verify `active-organization.ts` is gone**

```bash
ls src/server/authz/
```

Expected: `authorization.types.ts`, `organization-scope.ts`, `permission-checker.ts` — no `active-organization.ts`.

- [ ] **Step 5: Verify no remaining `auth.api.hasPermission` or `auth.api.listOrganizations` calls in server code**

```bash
grep -rn "hasPermission\|listOrganizations" src/server/ --include="*.ts"
```

Expected: zero results.

- [ ] **Step 6: Commit if any cleanup needed, otherwise note as complete**

```bash
git add -p
git commit -m "refactor(authz): session-scoped permissions — final cleanup"
```

---

## Summary of What Changed

| Before | After |
|---|---|
| `requirePermission` was `async`, called `listOrganizations` + `hasPermission` | `requirePermission` is sync, reads role from `ctx.activeOrganization` |
| 2 extra DB queries per permission check | 1 DB query total per request (at context creation), 0 per check |
| `AuthzContext` had `headers` + `sessionActiveOrganizationId` | `AuthzContext` has `activeOrganization: { organizationId, role } \| null` |
| `active-organization.ts` normalized fuzzy API response shapes | Deleted — role comes from a typed `$queryRaw` |
| `ResolveActiveOrganizationOptions` / `OrganizationMembership` types | Deleted — not needed |
| `assertEventInWeddingScope` etc. (legacy user-scoped helpers) | Deleted — replaced by org-scope pattern |
