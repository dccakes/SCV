# PR4: Next.js Performance + Architecture Cleanup Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve data-loading correctness, reduce duplicate fetch/hydration overhead, and apply low-risk bundle/image optimizations.

**Architecture:** Keep server components default, tighten provider boundaries, dedupe route data loading, and avoid broad refresh/refetch patterns.

**Tech Stack:** Next.js 15 App Router, React Query/tRPC client patterns, Jest, Tailwind.

---

### Task 1: Fix params/metadata data source correctness

**Files:**
- Modify: `src/app/[websiteSubUrl]/page.tsx`
- Modify: `src/app/[websiteSubUrl]/rsvp/page.tsx`
- Modify: `src/app/_components/website/wedding.tsx`
- Modify: `src/middleware.ts` (remove `x-url` coupling if obsolete)
- Create: `src/app/[websiteSubUrl]/_lib/load-wedding-by-suburl.ts`

**Tests:**
- Create: `tests/unit/app/website-suburl-metadata.test.ts`
- Update: `tests/unit/middleware.test.ts`

- [ ] Write failing tests for metadata sourced from `params.websiteSubUrl`.
- [ ] Refactor away custom header dependency.
- [ ] Confirm route behavior unchanged for valid/invalid suburls.
- [ ] Commit: `refactor: use params-based loading for website routes`

### Task 2: Dedupe RSVP metadata/page fetches

**Files:**
- Modify: `src/app/[websiteSubUrl]/rsvp/page.tsx`
- Modify/create: `src/app/[websiteSubUrl]/_lib/load-wedding-by-suburl.ts`

**Tests:**
- Create: `tests/unit/app/rsvp-page-loader-dedupe.test.ts`

- [ ] Write failing test for shared loader usage.
- [ ] Implement cached loader for metadata and page body.
- [ ] Verify tests green.
- [ ] Commit: `perf: dedupe rsvp metadata and page data fetches`

### Task 3: Reduce global provider/client scope

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/(authenicated)/layout.tsx`
- Optional modify/remove legacy overlap: `src/app/old_dashboard/layout.tsx`

**Tests:**
- Update: `tests/unit/app/authenicated-layout.test.tsx`

- [ ] Write failing tests for provider placement assumptions.
- [ ] Move route-specific providers out of root where possible.
- [ ] Keep one consistent tRPC provider boundary.
- [ ] Commit: `perf: scope providers to reduce global hydration cost`

### Task 4: Cut unnecessary refresh/refetch churn

**Files:**
- Modify: `src/app/(authenicated)/events/_components/events-page-client.tsx`
- Modify: `src/components/guest-list/guest-table.tsx`
- Modify: `src/components/guest-list/guests-view.tsx`

**Tests:**
- Update: `tests/unit/app/events-page-client.test.tsx`
- Update: `tests/unit/components/guest-list/guests-view.test.tsx`

- [ ] Add red tests for avoidable immediate refetch behavior.
- [ ] Apply query `staleTime` and targeted cache updates where safe.
- [ ] Reduce blanket `router.refresh()` calls.
- [ ] Commit: `perf: reduce unnecessary route refresh and duplicate fetches`

### Task 5: Bundle + image quick wins

**Files:**
- Modify: `next.config.js`
- Modify: `src/components/guest-list/index.tsx`
- Modify: `src/app/[websiteSubUrl]/layout.tsx`
- Modify: `src/app/_components/website/wedding-page.tsx`
- Modify: `src/app/_components/website/wedding-page-mobile.tsx`

- [ ] Add `optimizePackageImports` where beneficial.
- [ ] Dynamic import optional heavy guest CSV UI.
- [ ] Tighten `images.remotePatterns` to trusted hosts.
- [ ] Add `sizes`/`priority` to key above-the-fold images.
- [ ] Run `npm run test:unit`, `npm run lint`, `npm run build`.
- [ ] Commit: `perf: optimize imports and image delivery`

### Verification
- [ ] Metadata correctness validated for dynamic website routes.
- [ ] No duplicate RSVP data fetch path remains.
- [ ] App root hydration surface reduced and tests still pass.
