# OSW-77 Investigation: Invite Acceptance/Login Flow

Date: 2026-04-15
Owner: OSWP Staff Founding Full Stack Engineer
Scope: Investigation only (no implementation changes)

## 1) Deterministic Reproduction

### Repro command (unauthenticated browser context)

```bash
node --input-type=module <<'EOF'
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const started = Date.now();
const navs = [];
page.on('framenavigated', (frame) => {
  if (frame === page.mainFrame()) navs.push({ tMs: Date.now() - started, url: frame.url() });
});
await page.goto('http://127.0.0.1:3000/auth/accept-invitation?invitationId=inv_test_123', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
const body = await page.locator('body').innerText();
console.log(JSON.stringify({ navs, finalUrl: page.url(), hasSignIn: /Sign In/.test(body) }, null, 2));
await browser.close();
EOF
```

### Observed output

```json
{
  "navs": [
    {
      "tMs": 477,
      "url": "http://127.0.0.1:3000/auth/accept-invitation?invitationId=inv_test_123"
    },
    {
      "tMs": 929,
      "url": "http://127.0.0.1:3000/auth/accept-invitation?invitationId=inv_test_123"
    },
    {
      "tMs": 1206,
      "url": "http://127.0.0.1:3000/auth/sign-in?redirectTo=%2Fauth%2Faccept-invitation%3FinvitationId%3Dinv_test_123"
    }
  ],
  "finalUrl": "http://127.0.0.1:3000/auth/sign-in?redirectTo=%2Fauth%2Faccept-invitation%3FinvitationId%3Dinv_test_123",
  "hasSignIn": true
}
```

### Auth boundary evidence (network probe)

- `GET /api/auth/get-session` returns `200`.
- With no session in browser context, client navigation redirects from invite page to sign-in with `redirectTo` carrying original invite URL.

### Runtime trace (dev server)

Observed request sequence during reproduction:

```text
GET /auth/accept-invitation?invitationId=inv_test_123 200
GET /api/auth/get-session 200
GET /auth/sign-in?redirectTo=%2Fauth%2Faccept-invitation%3FinvitationId%3Dinv_test_123 200
```

## 2) Root Cause Trace (Systematic Debugging)

### Link intake boundary

- Invite email URL is generated as `/auth/accept-invitation?invitationId=<id>` in [`src/lib/auth.ts`](../../src/lib/auth.ts) (see `getInvitationAcceptUrl`).

### Invite page boundary

- Invite page renders Better Auth UI `AcceptInvitationCard` in [`src/app/auth/accept-invitation/page.tsx`](../../src/app/auth/accept-invitation/page.tsx).

### Auth gating boundary (primary root cause)

- `AcceptInvitationCard` calls `useAuthenticate()` before rendering invitation content.
- In Better Auth UI, `useAuthenticate()` redirects unauthenticated users to `SIGN_IN` and carries `redirectTo` back to current URL.
- Source evidence:
  - `node_modules/@daveyplate/better-auth-ui/src/components/organization/accept-invitation-card.tsx`
  - `node_modules/@daveyplate/better-auth-ui/src/hooks/use-authenticate.ts`

### Invite claim/accept boundary

- After authentication, `AcceptInvitationContent` loads invitation details (`useInvitation`) and only then allows `acceptInvitation/rejectInvitation`.
- Therefore, OSWP current flow is **intentionally auth-first** (login/signup before accepting invitation), not a random regression.

## 3) Is It Policy or Regression?

Conclusion: **Policy inherited from current Better Auth UI integration** (auth-first guard in component flow), and consistent with current OSWP wiring.

- No custom OSWP code bypasses this behavior today.
- OSWP currently composes the packaged card directly; behavior follows package semantics.

## 4) Market Pattern Benchmark (Primary Sources)

### GitHub

- Invite acceptance is account-based; invited email must match a verified email on the GitHub account.
- Source: https://docs.github.com/en/organizations/managing-membership-in-your-organization/inviting-users-to-join-your-organization

### Slack

- Invitees accept invitation and set up/sign into a workspace account flow.
- Source: https://slack.com/help/articles/212675257-Join-a-Slack-workspace

### Atlassian Cloud

- Invite flow supports users without existing Atlassian account by guiding account creation.
- Source: https://support.atlassian.com/jira-software-cloud/docs/add-new-users/

### Auth0 Organizations

- Invitation-aware auth route expects `invitation` + `organization` params and then login/signup in auth flow.
- Source: https://auth0.com/docs/manage-users/organizations/configure-organizations/invite-members

### Clerk Organizations

- Org invitation links route users through sign-in; if new, they sign up to accept.
- Source: https://clerk.com/docs/guides/organizations/invitations
- Source: https://clerk.com/docs/guides/development/custom-flows/organizations/manage-organization-invitations

### WorkOS

- Supports both auth-coupled acceptance and API-level acceptance method, with explicit eligibility/email checks.
- Source: https://workos.com/docs/user-management/invitations
- Source: https://workos.com/docs/reference/user-management/invitation/send

## 5) Option Set (A/B/C) With Security + Onboarding Impact

### Option A: Require signup/login before accept (current pattern)

Pros:
- Strong identity binding before membership mutation.
- Lower risk of token replay driving silent workspace membership.
- Aligns with common B2B patterns (GitHub/Auth0/Clerk).

Cons:
- More friction for first-time invitees.
- “Accept invite” expectation can feel delayed by auth wall.

Security posture: Strong default.
Onboarding interference risk: Low.

### Option B: Accept invite token first, then account creation

Pros:
- Lowest click friction at first contact.
- “Invitation accepted” feedback happens early.

Cons:
- Larger abuse/phishing surface if token handling is not strongly bound to invitee email.
- Requires deferred identity reconciliation and stronger anti-replay controls.

Security posture: Medium unless heavily constrained.
Onboarding interference risk: Medium (new pre-auth state management paths).

### Option C: Hybrid/passwordless handoff (recommended direction)

Pattern:
- Keep invite URL intake pre-auth.
- Force an invitation-aware auth path (magic link / OTP / sign-in-sign-up).
- Post-auth, auto-resume acceptance with server-side email-match validation and explicit confirmation.

Pros:
- Preserves strong identity checks.
- Reduces perceived friction by making invite context persistent through auth.
- Supports both existing and new users cleanly.

Cons:
- More orchestration complexity than Option A.
- Requires careful state machine and error UX.

Security posture: Strong (if email match + TTL + one-time token enforcement).
Onboarding interference risk: Low-Medium (manageable with route isolation).

## 6) Explicit Onboarding Non-Interference Check

Current onboarding/public entry paths are separate from org-invite auth paths:

- Public join route family (`/join/...`) and wedding website paths are treated as public in middleware:
  - [`src/middleware.ts`](../../src/middleware.ts)
- Invite acceptance lives under `/auth/accept-invitation`:
  - [`src/app/auth/accept-invitation/page.tsx`](../../src/app/auth/accept-invitation/page.tsx)

Implication:
- A redesign should stay isolated inside auth/org-invite boundaries and avoid changing `/join` token journeys.
- Add explicit regression coverage for public join + RSVP onboarding routes when implementing follow-up ticket.

## 7) Recommendation

Recommend **Option C (hybrid invitation-aware auth handoff)** for board approval:

- Keeps security posture close to current auth-first model.
- Improves UX by preserving invite intent through auth and auto-resuming acceptance.
- Avoids introducing a fully pre-auth membership mutation step.

## 8) Proposed Acceptance Criteria for Follow-up Implementation Ticket

1. Unauthenticated invitee opening invite link is routed through invitation-aware auth and returned to same invite context.
2. Existing user: successful sign-in lands on invite confirmation and can accept in one action.
3. New user: signup path preserves invite context and completes membership activation after verification.
4. Server enforces invitee-email binding, token TTL, and one-time acceptance semantics.
5. Expired/revoked/already-used invitations present explicit UX states.
6. No regressions in `/join` onboarding, public RSVP, and existing auth routes.
7. Add e2e coverage for invite happy path + key failure modes.
