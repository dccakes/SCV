# Household Save-the-Date Invites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build household-specific digital save-the-date links that set a one-year browser cookie and let invited households update their mailing details without RSVP.

**Architecture:** Add a signed token helper and a household invite application service. The public token route sets a scoped cookie and redirects to authenticated invite pages that load and update only the token household. The guest-list household detail panel gets a copy action for the household invite link.

**Tech Stack:** Next.js App Router, Server Components, route handlers, React client form, Prisma, tRPC, Jest, Tailwind/shadcn UI.

---

### Task 1: Token Helper

**Files:**
- Create: `src/server/application/household-invite/household-invite-token.ts`
- Test: `tests/unit/application/household-invite/household-invite-token.test.ts`

- [ ] Write failing tests for token creation, valid verification, tamper rejection, wrong-purpose rejection, and expired-token rejection.
- [ ] Run `npm run test:unit -- tests/unit/application/household-invite/household-invite-token.test.ts` and verify the tests fail because the helper does not exist.
- [ ] Implement HMAC-signed token creation and verification with one-year default expiry.
- [ ] Re-run the same test command and verify it passes.

### Task 2: Household Invite Service And Router

**Files:**
- Create: `src/server/application/household-invite/household-invite.service.ts`
- Create: `src/server/application/household-invite/index.ts`
- Create: `tests/unit/application/household-invite/household-invite.service.test.ts`
- Modify: `src/server/api/root.ts`

- [ ] Write failing tests that the service generates a link only for a household in the active wedding, loads invite data only when token/cookie scope matches `websiteSubUrl`, and rejects updates for guests outside the household.
- [ ] Run `npm run test:unit -- tests/unit/application/household-invite/household-invite.service.test.ts` and verify the tests fail because the service does not exist.
- [ ] Implement the service with direct Prisma reads/writes scoped by wedding, household, and website sub URL.
- [ ] Add a tRPC router endpoint for protected household invite link generation.
- [ ] Re-run the service test command and verify it passes.

### Task 3: Public Invite Routes And Form

**Files:**
- Create: `src/app/[websiteSubUrl]/invite/[token]/route.ts`
- Create: `src/app/[websiteSubUrl]/invite/page.tsx`
- Create: `src/app/[websiteSubUrl]/invite/update/page.tsx`
- Create: `src/components/website/household-invite/household-details-form.tsx`
- Test: `tests/unit/app/household-invite-pages.test.tsx`

- [ ] Write failing tests for token route cookie setting and the authenticated save-the-date page rendering household names and wedding details.
- [ ] Run `npm run test:unit -- tests/unit/app/household-invite-pages.test.tsx` and verify the tests fail.
- [ ] Implement the route handler, save-the-date page, update page, and prefilled update form.
- [ ] Re-run the page test command and verify it passes.

### Task 4: Dashboard Copy Link Action

**Files:**
- Modify: `src/components/guest-list/guest-detail-panel-content.tsx`
- Test: focused existing component tests if available; otherwise verify through typecheck and lint.

- [ ] Add a client-side copy button in the household detail panel that calls the protected household invite link endpoint.
- [ ] Keep the action scoped to the selected household and show clipboard success/failure text through existing toast patterns.
- [ ] Run `npm run check` after the implementation tasks.

### Task 5: Verification

**Files:**
- No new files.

- [ ] Run focused unit tests:
  `npm run test:unit -- tests/unit/application/household-invite/household-invite-token.test.ts tests/unit/application/household-invite/household-invite.service.test.ts tests/unit/app/household-invite-pages.test.tsx`
- [ ] Run `npm run check`.
- [ ] Review the diff against the requirements and note any residual risk.
