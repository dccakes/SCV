## 1. Token Helper

- [x] 1.1 Add tests for token creation, valid verification, tamper rejection, wrong-purpose rejection, and expired-token rejection.
- [x] 1.2 Implement HMAC-signed token creation and verification with one-year default expiry.
- [x] 1.3 Verify focused token tests pass.

## 2. Household Invite Service And Router

- [x] 2.1 Add tests proving the service generates links only for households in the active wedding.
- [x] 2.2 Add tests proving invite data loads only when token or cookie scope matches the website sub URL.
- [x] 2.3 Add tests proving updates reject guests outside the household.
- [x] 2.4 Implement the service with direct Prisma reads and writes scoped by wedding, household, and website sub URL.
- [x] 2.5 Add a protected tRPC endpoint for dashboard household invite link generation.
- [x] 2.6 Verify focused service tests pass.

## 3. Public Invite Routes And Form

- [x] 3.1 Add tests for token route cookie setting.
- [x] 3.2 Add tests for authenticated save-the-date rendering with household names and wedding details.
- [x] 3.3 Implement the token route handler, save-the-date page, update page, and prefilled update form.
- [x] 3.4 Verify focused page tests pass.

## 4. Dashboard Copy Link Action

- [x] 4.1 Add a client-side copy button in the household detail panel that calls the protected household invite link endpoint.
- [x] 4.2 Scope the action to the selected household and show clipboard success or failure through the existing UI feedback pattern.
- [x] 4.3 Verify guest-list component coverage and project checks pass.

## 5. Verification

- [x] 5.1 Run focused household invite unit tests.
- [x] 5.2 Run `npm run check`.
- [x] 5.3 Fix PR CI failures and verify GitHub checks pass.
- [x] 5.4 Review implementation against requirements and archive the completed OpenSpec change.
