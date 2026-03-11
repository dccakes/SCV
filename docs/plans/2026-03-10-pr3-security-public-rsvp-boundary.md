# PR3: Security + Public RSVP Boundary Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate client-side password exposure and provide a correct public RSVP submission path without protected auth dependency.

**Architecture:** Keep domain-layer boundaries intact (router thin, service business logic, repository data access). Build password verification and RSVP token validation server-side only.

**Tech Stack:** Next.js App Router, tRPC, domain services/repositories, Jest.

---

### Task 1: Red tests for website password secrecy

**Files:**
- Create: `tests/unit/domains/website/website-password.service.test.ts`
- Update: `tests/unit/domains/website/website.service.test.ts`
- Create: `tests/unit/app/website-password-flow.test.tsx`

- [ ] Write failing tests ensuring raw website password is never sent to client payload.
- [ ] Write failing tests for server-side verify-only behavior.
- [ ] Run tests to confirm red.
- [ ] Commit: `test: enforce server-only website password verification`

### Task 2: Implement secure password verification flow

**Files:**
- Modify: `src/server/domains/website/website.service.ts`
- Modify: `src/server/domains/website/website.router.ts`
- Modify: `src/app/[websiteSubUrl]/page.tsx`
- Modify: `src/app/_components/website/password-page.tsx`
- Modify: `src/app/utils/shared-types.ts`
- Optional create: `src/server/domains/website/website-password.service.ts`

- [ ] Store/compare hashed password server-side only.
- [ ] Replace client comparison with server verification endpoint/action.
- [ ] Ensure access state is cookie/session-based (`httpOnly`, `secure`).
- [ ] Run tests to green.
- [ ] Commit: `fix: secure website password flow server-side`

### Task 3: Red tests for public RSVP procedure

**Files:**
- Create: `tests/unit/domains/website/website.router.public-rsvp.test.ts`
- Update: `tests/unit/application/rsvp-submission/rsvp-submission.service.test.ts`

- [x] Write failing tests for unauthenticated valid-token submit success.
- [x] Write failing tests for invalid/expired token rejection.
- [x] Confirm protected procedure is no longer required for public RSVP.
- [ ] Commit: `test: define public rsvp boundary behavior`

### Task 4: Implement public RSVP endpoint/procedure

**Files:**
- Modify: `src/server/domains/website/website.router.ts`
- Modify: `src/app/_components/website/forms/main.tsx`
- Modify/create as needed: `src/server/application/rsvp-submission/*`

- [x] Add dedicated public submit path with invitation/household token validation.
- [ ] Add anti-abuse guardrails hook (rate limiting/logging integration point).
- [x] Update client form to call new public procedure.
- [x] Run related tests.
- [ ] Commit: `feat: add public token-validated rsvp submission flow`

### Verification
- [ ] Raw password no longer present in client-facing types/data.
- [x] Public RSVP works without auth and fails safely with invalid tokens.
- [x] `npm run test:unit -- tests/unit/domains/website/*` passes.
