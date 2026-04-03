# Auth Remediation Implementation Plan

## Goal

Unify the application's role model, enforce authorization consistently at the use-case layer,
keep domain logic separated from application concerns, make middleware handle coarse
authentication redirects, and make Etta reuse the same authorized flows as the rest of the app.

This plan also covers the production audit and migration steps for the single live customer once
the permission model is implemented.

## Final Role Model

Supported roles:

- `owner`
- `admin`
- `member`
- `viewer`

Role intent:

- `owner`
  - Full access
  - Can manage organization members/invitations
  - Can delete the organization
- `admin`
  - Full wedding-planning access
  - Can manage organization members/invitations
  - Cannot delete the organization
- `member`
  - Planner/editor role
  - Can view and edit wedding planning data
  - Cannot manage organization membership
  - Cannot send communications out of the platform
  - Cannot delete the wedding organization
- `viewer`
  - Final behavior must be enforced explicitly in the permission matrix
  - If the product expectation is that Fiona should not see planning surfaces, `viewer` should have
    no planning read permissions

## Permission Model Rules

The permission matrix should be defined centrally in `src/lib/auth-permissions.ts`.

Expected shape:

- `owner`
  - full resource access
- `admin`
  - full planning access
  - `organization.delete` denied
- `member`
  - allow:
    - `guest.read/create/update/delete/import`
    - `guest_event.read/add_guest_to_event/remove_guest_from_event`
    - `event.read/create/update/delete/rsvp_policy_update`
    - `rsvp.read_responses/edit_response/export/reopen_submission`
    - `vendor.read/create/update/delete`
    - `vendor_quote.read/create/update/delete`
    - `website.read/update/publish/password_update`
    - `wedding.read/update`
    - `guest_invitation.read/create/cancel` only if those actions are internal-only in the app
  - deny:
    - `member.create/update/delete`
    - `invitation.create/cancel`
    - `guest_invitation.send/resend`
    - `organization.delete`
- `viewer`
  - must be decided and encoded explicitly
  - if viewers should not access planning data, deny `guest.read`, `event.read`, `vendor.read`,
    `vendor_quote.read`, `wedding.read`, `website.read`, and related reads

## Architectural Principles

Layering:

- Routes
  - authentication only
  - input validation only
  - delegate to one use-case
- Use-cases / application services
  - authorization
  - workspace scope resolution assertions
  - orchestration across domain services
- Domain services
  - domain rules and invariants
  - no route-specific behavior
- Repositories
  - persistence only
  - no authentication or authorization logic

Etta:

- authenticate as the acting user
- resolve the same workspace/authz context as the app
- call permissioned use-cases
- never call raw repository-style or unpermissioned domain readers

## Current Problems To Fix

1. Role vocabulary mismatch
   - code recognizes `owner/admin/editor/viewer`
   - seed/UI/data can still produce `member`
2. Read routes are under-protected
   - guest reads
   - event reads
   - invitation reads
   - dashboard aggregation
3. Page rendering is gated by "has a wedding" instead of "has capability"
4. Middleware only checks for a session cookie on a few routes
5. Etta bypasses the same permission surface as the app
6. Workspace/auth data still relies on multiple concepts
   - active organization
   - wedding linkage
   - legacy `UserWedding`

## Canonical Runtime Auth Model

The server should resolve one canonical workspace object per request:

- `organizationId`
- `weddingId`
- `role`
- resolved capabilities or a permission evaluation helper

This object should be produced in the tRPC context and consumed everywhere else.

Rules:

- `member.role` on the active organization is the canonical runtime role
- `Wedding.organizationId` remains the org->wedding link
- `UserWedding.role` must not be used for authorization decisions
- protected app flows must not fall back to "first wedding for user" once workspace scope exists

## Use-Case Layer Plan

Add use-cases above the existing domain services. These do not replace domain services; they wrap
them where authz and orchestration belong.

Initial use-cases:

- `GetDashboardOverviewUseCase`
- `GetGuestListUseCase`
- `GetHouseholdGuestsUseCase`
- `GetEventInvitationsUseCase`
- `GetEventsOverviewUseCase`
- `GetInvitationListUseCase`
- `GetVendorsUseCase`
- `GetVendorDetailUseCase`

Potential Etta-specific use-cases:

- `GetGuestRsvpSummaryUseCase`
- `GetGuestEventAttendanceUseCase`
- `ListEventAttendanceUseCase`

Each use-case must:

1. accept canonical auth/workspace context
2. call `requirePermission(...)`
3. assert entity scope belongs to the active wedding where applicable
4. call existing domain services

## Route Refactor Plan

Priority routers:

- `src/server/domains/guest/guest.router.ts`
- `src/server/domains/event/event.router.ts`
- `src/server/domains/invitation/invitation.router.ts`
- `src/server/application/dashboard/dashboard.router.ts`

Refactor rules:

- authenticated workspace reads must use `protectedProcedure`
- no `publicProcedure` for authenticated wedding/workspace data
- routes should not perform authorization directly beyond ensuring they pass the correct context to
  the use-case

## Domain Service Hardening

Even after use-cases exist, direct domain service calls should not be unsafe if reused.

Priority hardening:

- `src/server/domains/guest/guest.service.ts`
  - ensure update/delete operations verify the target guest belongs to the active wedding scope

Goal:

- writes require permission and ownership assertions
- reads used by Etta or other callers should have permissioned entry points in use-cases

## Page Gating Plan

Server-rendered authenticated pages must gate on capability, not just wedding existence.

Priority pages:

- `src/app/(authenicated)/dashboard/page.tsx`
- `src/app/(authenicated)/guest-list/page.tsx`
- `src/app/(authenicated)/events/page.tsx`
- `src/app/(authenicated)/vendors/page.tsx`
- `src/app/(authenicated)/settings/page.tsx`

Rules:

- page loaders call a server-side capability helper
- unauthorized users should be redirected away from the page
- sidebar navigation should only show routes the current user can access

## Middleware Plan

Middleware should enforce coarse authentication only.

Desired behavior:

- treat basically everything except explicit public routes as protected
- redirect unauthenticated users to `/auth/signin`

Public routes should include:

- `/`
- auth routes
- public wedding website routes
- static assets
- explicitly public APIs

Middleware must not become the fine-grained authorization layer.

## Etta Plan

Etta must operate with the exact permissions of the acting user.

Refactor:

- `src/lib/etta/tools/guests.ts`
- `src/lib/etta/tools/vendors.ts`
- any other Etta tools reading planning data

Rules:

- no raw `getAllByWeddingId`-style reads without authz
- Etta tools call use-cases
- Etta-specific use-cases are allowed if the user interaction is unique
- repositories remain unaware of whether the caller is UI or Etta

## Client Hook Plan

After the server contract is stable, add a client hook such as `useWorkspace()` or `useWedding()`.

The hook should expose:

- `organizationId`
- `weddingId`
- `role`
- capability booleans

The hook must consume a canonical server-derived payload and must not become a second source of
truth.

## Seed And Data Alignment

Update seed data after the new role model is implemented:

- only write supported roles
- remove any remaining `editor` assumptions
- ensure settings/member-management UI only offers supported roles

## Production Audit SQL

Inspect all relevant role and workspace state:

```sql
select
  u.email,
  m."organizationId",
  m.role as member_role,
  uw.role as user_wedding_role,
  uw."isPrimary",
  w.id as wedding_id,
  w."organizationId" as wedding_organization_id,
  s."activeOrganizationId" as session_active_organization_id
from "User" u
left join member m on m."userId" = u.id
left join "UserWedding" uw on uw."userId" = u.id
left join "Wedding" w on w.id = uw."weddingId"
left join "Session" s on s."userId" = u.id
order by u.email, m."organizationId";
```

Supported role audit:

```sql
select role, count(*)
from member
group by role
order by role;
```

Organizations not linked to a wedding:

```sql
select
  m.id as member_id,
  m."userId",
  m."organizationId",
  m.role
from member m
left join "Wedding" w on w."organizationId" = m."organizationId"
where w.id is null
order by m."organizationId", m."userId";
```

Sessions pinned to invalid organizations:

```sql
select
  s.id as session_id,
  s."userId",
  s."activeOrganizationId"
from "Session" s
left join "Wedding" w on w."organizationId" = s."activeOrganizationId"
where s."activeOrganizationId" is not null
  and w.id is null
order by s."updatedAt" desc;
```

## Production Migration Sequence

Do this only after the new permission model and route enforcement are deployed.

1. audit live roles and workspace state
2. normalize unsupported roles to the final supported role set
3. clear or repair stale `Session.activeOrganizationId`
4. optionally align legacy `UserWedding.role` values until that field is fully unused

Because there is only one live customer, this can be a targeted migration after the audit report is
reviewed.

## `organizationId == weddingId`

This is a valid target architecture, but it is a second-stage migration, not the first fix.

Reason:

- the immediate issues are role mismatch and missing read authorization
- ID unification is beneficial, but it rewrites Better Auth and wedding references across the system

Recommended approach:

1. first fix permissions and canonical runtime workspace scope
2. then audit existing org/wedding mismatches
3. then decide whether to unify IDs physically for all existing records

## TDD Rollout Order

1. permission matrix tests
2. seed-role consistency tests
3. authenticated read-route authorization tests
4. page-loader capability tests
5. Etta permission tests
6. migration report tests
7. implementation in the same order

## Suggested First Delivery Slice

1. finalize role matrix
2. replace `editor` with `member`
3. update seed and role UI
4. convert guest/event/invitation/dashboard reads to permissioned use-cases
5. add server page gating
6. refactor Etta onto the same use-cases
7. run production audit

## Progress Log

- 2026-04-03: Added canonical workspace capabilities in request context and gated nav/layout by
  capability.
- 2026-04-03: Updated seed/e2e role fixtures to owner/member/viewer and removed editor role usage
  in runtime authz paths.
- 2026-04-03: Hardened read authorization across guest/event/invitation/dashboard surfaces and
  aligned dashboard APIs to scoped-only reads.
- 2026-04-03: Refactored workspace scope resolution into resolver/repository/service layers with
  compatibility tests preserved.
- 2026-04-03: Consolidated shared auth display/error helpers and completed dashboard workspace
  endpoint fallout updates.
- 2026-04-03: Added shared script dry-run arg parser and rewired workspace operational scripts to
  use it.
- 2026-04-03: Moved dashboard read authorization from router into
  `DashboardOverviewUseCase` and updated router wiring.
- 2026-04-03: Added `GuestInsightsService` application boundary for guest/event/invitation reads
  and rewired guest router + Etta guest read tools to use it.
- 2026-04-03: Added `EventInsightsService` application boundary and rewired event/invitation read
  routes to delegate authorization and scoped reads through it.
- 2026-04-03: Hardened vendor domain API shape by renaming the unpermissioned raw list method to
  `getVendorsSystem` to make system-only usage explicit.
- 2026-04-03: Added vendor authz regression coverage for router (`viewer`, unauthenticated, missing
  active wedding) and Etta vendor tool permission-denied scenarios.
