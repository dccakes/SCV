# OSW-82 Option C Invite Handoff Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement an invitation-aware auth handoff so invite links preserve context through sign-in/sign-up and resume acceptance post-auth with clear invalid-state UX.

**Architecture:** Keep `/auth/accept-invitation` as the canonical intake route. Render a pre-auth handoff view when no session exists (with explicit sign-in/sign-up actions that preserve invite context via `redirectTo`), and render the existing Better Auth acceptance card only for authenticated users. Reuse Better Auth server-side invite acceptance semantics for email match/TTL/one-time behavior.

**Tech Stack:** Next.js App Router, Better Auth UI, Jest (unit), Playwright (e2e).

---

### Task 1: Add failing unit tests for invitation-aware handoff

**Files:**
- Modify: `tests/unit/app/auth-accept-invitation.page.test.tsx`
- Test: `tests/unit/app/auth-accept-invitation.page.test.tsx`

- [ ] **Step 1: Write failing tests for unauthenticated handoff behavior**
- [ ] **Step 2: Run test to verify it fails**
Run: `npm run test:unit -- tests/unit/app/auth-accept-invitation.page.test.tsx`
Expected: FAIL because page still always renders `AcceptInvitationCard`.
- [ ] **Step 3: Add failing test for authenticated behavior preservation**
- [ ] **Step 4: Run test to verify targeted failures are correct**

### Task 2: Implement invitation-aware handoff page logic

**Files:**
- Modify: `src/app/auth/accept-invitation/page.tsx`
- (Optional) Create: `src/components/auth/invitation-auth-handoff.tsx`

- [ ] **Step 1: Add minimal implementation to detect session server-side**
- [ ] **Step 2: Render pre-auth handoff UI with sign-in/sign-up actions preserving `redirectTo` back to invite URL**
- [ ] **Step 3: Keep current authenticated acceptance flow by rendering `AcceptInvitationCard` when session exists**
- [ ] **Step 4: Re-run unit tests and make all pass**
Run: `npm run test:unit -- tests/unit/app/auth-accept-invitation.page.test.tsx`
Expected: PASS.

### Task 3: Add failing e2e coverage for invite handoff + recovery paths

**Files:**
- Create: `tests/e2e/invite-acceptance.public.spec.ts`
- Modify: `playwright.config.ts` (only if public project matcher needs expansion)

- [ ] **Step 1: Write failing e2e tests for unauthenticated invite visit showing handoff state**
- [ ] **Step 2: Add test asserting sign-in route preserves invite callback context**
- [ ] **Step 3: Add test for missing/invalid invitation id UX state**
- [ ] **Step 4: Run e2e file to verify initial failure, then pass after implementation**
Run: `npm run test:e2e -- tests/e2e/invite-acceptance.public.spec.ts`
Expected: FAIL before implementation, PASS after.

### Task 4: Regression verification and PR prep artifacts

**Files:**
- Modify: `pull-request-template.md` (copy into PR body, not committed unless repo expects it)

- [ ] **Step 1: Run focused unit + e2e suite**
Run: `npm run test:unit -- tests/unit/app/auth-accept-invitation.page.test.tsx tests/unit/middleware.test.ts`
Run: `npm run test:e2e -- tests/e2e/invite-acceptance.public.spec.ts`
- [ ] **Step 2: Run lint/check on touched files**
Run: `npm run check`
- [ ] **Step 3: Prepare PR description from template with scope, tests, and risk notes**

