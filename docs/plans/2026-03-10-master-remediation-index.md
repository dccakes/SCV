# Master Remediation Index: Mobile, UI, Security, Next.js

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement linked plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Coordinate 4 implementation streams to deliver mobile-first UX, OSWP UI consistency, security boundary fixes, and Next.js performance/correctness improvements.

**Architecture:** Execute in dependency-aware waves. Prioritize security and mobile usability first, then visual consistency, then architecture/performance refinements.

**Tech Stack:** Next.js 15, React 19, TypeScript, tRPC, Jest + Testing Library, Tailwind CSS.

---

## Linked Plans

- [ ] `docs/plans/2026-03-10-pr1-mobile-a11y-foundation.md` (P0)
- [ ] `docs/plans/2026-03-10-pr2-oswp-ui-consistency.md` (P1)
- [ ] `docs/plans/2026-03-10-pr3-security-public-rsvp-boundary.md` (P0)
- [ ] `docs/plans/2026-03-10-pr4-nextjs-performance-architecture.md` (P1/P2)

## Dependency Graph

- **PR1** and **PR3** can start immediately in parallel (low file overlap if PR1 avoids RSVP security internals).
- **PR2** should start after PR1 Task 2/3 lands (reduces conflicts in shared form files and style helpers).
- **PR4 Task 1/2** can run after PR3 route changes stabilize on `src/app/[websiteSubUrl]/*`.
- **PR4 Task 3/4/5** can run independently once route/data changes are merged.

## Parallel Agent Execution Waves

### Wave A (start now)

- [ ] **Agent A (PR1):** Execute Task 1-2 first (semantic interactions + keyboard support).
- [ ] **Agent B (PR3):** Execute Task 1-2 (password secrecy tests + secure server-side verification).

### Wave B

- [ ] **Agent C (PR1):** Execute Task 3-4 (responsive widths + mobile nav parity).
- [ ] **Agent D (PR3):** Execute Task 3-4 (public RSVP boundary + client integration).

### Wave C

- [ ] **Agent E (PR2):** Execute all tasks after PR1 merges, resolve shared-style conflicts once.
- [ ] **Agent F (PR4):** Execute Task 1-2 after PR3 merges (`params` + fetch dedupe).

### Wave D

- [ ] **Agent G (PR4):** Execute Task 3-5 (provider scope, refresh churn, bundle/image optimizations).

## Ownership + Review Checklist

- [ ] Every task follows TDD (Red -> Green -> Refactor).
- [ ] Every PR includes targeted tests and a small blast radius.
- [ ] Every PR includes mobile viewport verification notes (320/375/390/414/768).
- [ ] Every PR includes keyboard/a11y verification for touched interactions.
- [ ] No raw password data crosses server/client boundary.
- [ ] Public RSVP endpoint remains unauthenticated but token-validated.

## Merge Order

1. PR3 (Security boundary)
2. PR1 (Mobile + a11y)
3. PR2 (OSWP consistency)
4. PR4 (Next.js architecture/performance)

## Final Release Gate

- [ ] `npm run test:unit`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Manual mobile smoke on core routes
- [ ] Manual RSVP public flow smoke (valid + invalid token)
- [ ] Manual website password gate smoke
