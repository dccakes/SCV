# Merge Main and Deployment Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the latest `origin/main` into `dc/geo-language-detection` while preserving the branch's uncommitted localization work and restoring a passing production deployment build.

**Architecture:** Preserve the dirty worktree in a named stash, merge the fetched remote base into the existing Conductor workspace branch, then reapply the stash. Resolve conflicts in favor of retaining both upstream behavior and the branch's locale detection/translation behavior, and use the repository's own checks and CI build as the deployment contract.

**Tech Stack:** Git, Next.js 15, React 19, TypeScript, next-intl, Prisma, Biome, Jest, Vercel

## Global Constraints

- Keep the current branch name `dc/geo-language-detection`.
- Preserve the existing uncommitted change in `src/app/join/[token]/page.tsx` and the untracked design spec under `docs/superpowers/specs/`.
- Merge `origin/main`; do not rebase or rewrite branch history.
- Treat `npm run build:ci` as the production deployment build check.

---

### Task 1: Preserve local work and merge the remote base

**Files:**
- Preserve: `src/app/join/[token]/page.tsx`
- Preserve: `docs/superpowers/specs/2026-06-23-geo-language-detection-design.md`
- Modify: files selected by Git while merging `origin/main`

**Interfaces:**
- Consumes: fetched `origin/main` at `7aca53e9`
- Produces: a merge commit on `dc/geo-language-detection` with the pre-merge dirty work restored

- [ ] **Step 1: Save all tracked and untracked local work**

Run: `rtk git stash push --include-untracked -m 'pre-origin-main-merge-2026-08-24'`

Expected: Git reports the working directory and index state were saved.

- [ ] **Step 2: Merge the fetched base branch**

Run: `rtk git merge --no-edit origin/main`

Expected: Git creates a merge commit or pauses with a finite list of conflicts to resolve.

- [ ] **Step 3: Resolve every merge conflict and complete the merge**

For each conflicted file, preserve upstream application behavior and reapply the locale integration at the current APIs. Stage resolutions with `rtk git add <exact-file>` and complete with `rtk git commit --no-edit`.

Expected: `rtk git diff --name-only --diff-filter=U` prints no paths.

- [ ] **Step 4: Restore the saved local work**

Run: `rtk git stash pop`

Expected: the localized join-page change and design spec return; any stash conflict is resolved with the same combined-behavior rule.

### Task 2: Repair deployment compatibility

**Files:**
- Modify: only source, test, package, Prisma, Next.js, or Vercel files identified by fresh check failures
- Test: the corresponding files under `tests/unit/`

**Interfaces:**
- Consumes: merged application and the repository scripts in `package.json`
- Produces: code compatible with the latest main-branch APIs and a successful Vercel-equivalent CI build

- [ ] **Step 1: Run the focused localization tests**

Run: `rtk npm run test:unit -- --runInBand tests/unit/i18n tests/unit/lib/locale tests/unit/middleware.test.ts tests/unit/middleware/locale-resolution.test.ts`

Expected: all selected Jest suites pass.

- [ ] **Step 2: Run the complete static check**

Run: `rtk npm run check`

Expected: Biome exits with status 0 and reports no errors.

- [ ] **Step 3: Run the deployment build**

Run: `rtk npm run build:ci`

Expected: Next.js exits with status 0 after compiling, type-checking, and generating routes.

- [ ] **Step 4: Diagnose and fix failures at their root cause**

When any command fails, reproduce the narrowest failing test or compiler error, add or update the smallest relevant regression test where behavior changed, implement the minimal compatibility fix, then rerun that narrow check before returning to Steps 1–3.

Expected: each previously failing command exits with status 0 on a fresh rerun.

### Task 3: Verify the final integration state

**Files:**
- Inspect: all files changed relative to `origin/main`

**Interfaces:**
- Consumes: merged and deployment-compatible worktree
- Produces: evidence-backed handoff with merge commit, remaining intentional dirty files, and fresh verification results

- [ ] **Step 1: Confirm ancestry and conflict state**

Run: `rtk git merge-base --is-ancestor origin/main HEAD` and `rtk git diff --name-only --diff-filter=U`

Expected: the ancestry check exits 0 and the conflict list is empty.

- [ ] **Step 2: Inspect final worktree changes**

Run: `rtk git status --short --branch` and `rtk git diff --check`

Expected: no merge conflicts or whitespace errors; any dirty paths are intentional preserved work or necessary post-merge deployment fixes.

- [ ] **Step 3: Report exact verification evidence**

Record the merge commit, concise changed-file summary, and exit status from the focused tests, Biome check, and deployment build.

Expected: the user receives the current branch state and any remaining limitations without unsupported completion claims.
