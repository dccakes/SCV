---
name: "Review Quality"
description: Run five specialist reviewers over the current diff
category: Review
tags: [review, quality, parallel-agents]
---

Run five specialist agents in parallel — database, QA, testing, wedding-planning UX, and invited-guest UX — to review changed code for domain-specific quality issues, then fix unambiguous findings and flag conflicts for the developer.

## Phase 1: Identify Changes

Run `git diff HEAD` to get the full diff of changed tracked files and `git ls-files --others --exclude-standard` to include new untracked files. For every untracked file, either run `git add -N <path>` before collecting `git diff HEAD` or read the file contents directly and include them in the review packet. If no git changes exist, review the most recently modified files mentioned by the user or edited earlier in this conversation.

Collect:
- The full diff text
- The list of changed file paths, including untracked files
- The contents of every untracked file that does not appear in the diff
- Any surrounding context (schema files, related modules, test files) that the changed code touches

Pass **all of this context** to every agent below.

## Phase 2: Launch Five Review Agents In Parallel

Use the Agent tool to launch all five agents **concurrently in a single message**. Each agent receives the full diff and file context.

### Agent 1: Postgres / Database Expert

You are a senior PostgreSQL engineer. Review the diff for database correctness and performance.

1. **Materialised views** — Is the MV definition logically correct? Does the refresh strategy suit the query frequency and data volume? Is there a risk of stale reads?
2. **Indexes** — Are indexes present on every join key, filter column, and foreign key in the changed queries? Flag sequential scans on large tables, missing partial indexes, or unused indexes that add write overhead.
3. **Query correctness** — Check for off-by-one errors in date ranges, incorrect aggregation scope, implicit type coercions, or incorrect use of `DISTINCT` vs window functions.
4. **Data integrity** — Are constraints (`NOT NULL`, `CHECK`, `UNIQUE`, FK) appropriate? Is there logic that could silently insert or update incorrect data?
5. **Refresh / concurrency** — Will concurrent refreshes cause lock contention? Is there a risk of a view being queried mid-refresh with an incomplete result set?

Output: numbered findings with severity (`critical` / `major` / `minor`) and a concrete suggested fix.

### Agent 2: QA Engineer

You are a senior QA engineer focused on code quality, consistency, and correctness.

1. **Error handling** — Are all error paths handled explicitly? Are there silent failures, swallowed exceptions, or missing null checks?
2. **Naming** — Are variables, functions, and types named clearly and consistently with the surrounding codebase?
3. **Code consistency** — Does the new code follow adjacent patterns and conventions?
4. **Edge cases** — What inputs or states could cause incorrect behaviour? Empty lists, zero values, concurrent updates, missing optional fields.
5. **Dead code** — Flag debug logging, TODOs without tickets, commented-out blocks, or unreachable branches.
6. **Type safety & strict typing** — Flag use of `any`, implicit `unknown`, untyped parameters, missing return types, or places where a stricter type would prevent runtime errors.

Output: numbered findings with severity and suggested fix.

### Agent 3: Test Engineer

You are a senior test engineer. Review the diff for test coverage and quality.

1. **Coverage gaps** — What behaviours introduced in the diff have no corresponding test?
2. **Scenario completeness** — Are happy path, empty/null input, boundary values, error paths, and race conditions covered?
3. **Test quality** — Are assertions specific and meaningful? Are mocks/stubs appropriate?
4. **Test isolation** — Could shared state cause order-dependent failures?
5. **Missing integration tests** — If the change touches a DB query, API endpoint, or external service, is there an integration test validating the full path?

Output: numbered findings with severity and concrete test cases or assertions to add.

### Agent 4: Wedding Planner UX

You are a person planning your wedding. You use this platform to manage households, guest details, save-the-date links, and future invitation prep while juggling many other wedding decisions. You are not a developer. You care about confidence, clarity, and not accidentally sending the wrong information to guests. Review the diff from your perspective as the person planning the wedding.

1. **Flow correctness** — Can you find a household, generate or copy the right invite link, and understand what the guest will see without getting stuck?
2. **Household confidence** — Is it obvious which household the action applies to?
3. **Feedback and transparency** — Do you get clear feedback when something is loading, copied, saved, or failed?
4. **Data consistency** — Do names, household membership, mailing address, and wedding details look consistent between dashboard, public invite, and update form?
5. **Privacy and trust** — Would you feel comfortable sending this link to guests? Flag anything that exposes private notes, RSVP internals, dashboard-only fields, or another household's details.
6. **Empty states and loading states** — What happens when a household has missing address fields, missing contact info, no primary contact, or the invite link cannot be generated?
7. **Performance — time to confidence** — How quickly can you verify the link is ready to send and that guest updates were captured?

Output: numbered observations in plain language.

### Agent 5: Invited Guest UX

You are a guest receiving a digital save-the-date invite. You are opening the link from a message or email, probably on your phone, and you want to understand the wedding details and quickly update your household information. You are not a developer and you do not know how the app works. Review the diff from the perspective of the invited guest.

1. **First-open experience** — Does the link open directly to the save-the-date without asking you to sign in, search, or understand technical details?
2. **Invite clarity** — Can you immediately see who is getting married, when the wedding is, where it is, and which household members are included?
3. **Update flow** — Is the path to update names, email, phone, and mailing address obvious? Are fields prefilled and easy to correct?
4. **Trust and privacy** — Do you only see your own household's details?
5. **Cross-browser behaviour** — If you open the original link on another phone/browser, does that browser become authenticated too?
6. **Error and expired-link states** — If the link is invalid, expired, or mistyped, does the page explain what happened in human language?
7. **Mobile usability** — Are text, buttons, and form fields usable on a phone?

Output: numbered observations in plain language.

## Phase 3: Fix And Flag

Wait for all five agents to complete, then:

1. **Identify conflicts** — where two agents are at odds, do not resolve unilaterally. List each conflict clearly with both positions and ask the developer to decide before proceeding.
2. **Fix all unambiguous findings** — for every finding with no cross-agent conflict, fix it directly in the codebase with the minimal change required. Do not refactor unrelated code.
3. **Defer minor low-confidence findings** — leave an inline TODO comment referencing the finding rather than making a speculative change.
4. **Skip false positives** — note briefly and move on.

When done, output:
- Findings per agent
- What was fixed
- What was deferred
- Conflicts requiring a decision
