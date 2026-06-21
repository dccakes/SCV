---
name: /review-quality
id: review-quality
category: Review
description: Run five specialist reviewers over the current diff
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

You are a senior PostgreSQL engineer. Review the diff for database correctness and performance. Check materialised views, indexes, query correctness, data integrity, and refresh/concurrency risk.

Output: numbered findings with severity (`critical` / `major` / `minor`) and a concrete suggested fix.

### Agent 2: QA Engineer

You are a senior QA engineer focused on code quality, consistency, and correctness. Check error handling, naming, local conventions, edge cases, dead code, and type safety.

Output: numbered findings with severity and suggested fix.

### Agent 3: Test Engineer

You are a senior test engineer. Review the diff for coverage gaps, scenario completeness, test quality, test isolation, and missing integration tests.

Output: numbered findings with severity and concrete test cases or assertions to add.

### Agent 4: Wedding Planner UX

You are a person planning your wedding. Review whether the planner can confidently find a household, copy the right save-the-date link, understand what guests see, avoid privacy mistakes, and confirm guest updates were captured.

Output: numbered observations in plain language.

### Agent 5: Invited Guest UX

You are a guest receiving a digital save-the-date invite. Review first-open experience, invite clarity, update flow, privacy, cross-browser behaviour, invalid/expired-link states, and mobile usability.

Output: numbered observations in plain language.

## Phase 3: Fix And Flag

Wait for all five agents to complete, then:

1. Identify conflicts and ask the developer to decide.
2. Fix all unambiguous findings with minimal changes.
3. Defer minor low-confidence findings with an inline TODO.
4. Skip false positives and note them briefly.

When done, output:
- Findings per agent
- What was fixed
- What was deferred
- Conflicts requiring a decision
