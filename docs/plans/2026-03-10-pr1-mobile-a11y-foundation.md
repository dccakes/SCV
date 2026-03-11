# PR1: Mobile + Accessibility Foundation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove mobile-breaking layout issues and fix semantic interaction/accessibility regressions in core public and guest-list flows.

**Architecture:** Test-first across interaction semantics, keyboard operability, and responsive constraints. Prioritize user-critical flows first (close controls, card actions, mobile nav, responsive forms).

**Tech Stack:** Next.js 15, React 19, TypeScript, Jest + Testing Library, Tailwind CSS.

---

### Task 1: Add red tests for semantic interactions

**Files:**
- Create: `tests/unit/app/_components/forms/event-form-accessibility.test.tsx`
- Create: `tests/unit/app/_components/forms/question-form-accessibility.test.tsx`
- Create: `tests/unit/components/guest-list/guest-table-accessibility.test.tsx`

- [ ] Write failing tests asserting close controls are semantic buttons with accessible names.
- [ ] Write failing tests asserting guest card/row interactions are keyboard-usable.
- [ ] Run tests to confirm red.
- [ ] Commit: `test: add a11y coverage for semantic interactions`

### Task 2: Replace non-semantic click targets

**Files:**
- Modify: `src/app/_components/forms/event-form.tsx`
- Modify: `src/app/_components/forms/question-form.tsx`
- Modify: `src/app/_components/website/forms/main.tsx`
- Modify: `src/components/guest-list/guest-table.tsx`

- [ ] Convert icon/div click targets to `<button type="button">` or true links.
- [ ] Add `aria-label` and visible `focus-visible` ring styling.
- [ ] Re-run Task 1 tests to green.
- [ ] Commit: `fix: make form and guest interactions accessible`

### Task 3: Remove fixed-width mobile breakpoints

**Files:**
- Modify: `src/app/_components/website/forms/main.tsx`
- Modify: `src/app/_components/forms/event-form.tsx`
- Modify: `src/app/_components/forms/question-form.tsx`
- Modify: `src/app/utils/shared-styles.ts`

**Tests:**
- Create: `tests/unit/app/_components/website/forms/main-layout.test.tsx`

- [ ] Write failing tests for responsive class contract (`w-full` + `max-w-*`).
- [ ] Replace hard widths (`w-[450px]`, `w-[525px]`) with mobile-first responsive classes.
- [ ] Run tests and verify no regressions.
- [ ] Commit: `fix: make website and form layouts mobile-safe`

### Task 4: Add mobile nav parity on non-authenticated home

**Files:**
- Modify: `src/app/_components/home/non-authenticated-view.tsx`
- Optional create: `src/app/_components/home/mobile-nav.tsx`
- Create/modify: `tests/unit/app/non-authenticated-view-mobile-nav.test.tsx`

- [ ] Write failing test for mobile nav trigger and link availability.
- [ ] Implement mobile nav with keyboard/focus management.
- [ ] Re-run home/nav tests.
- [ ] Commit: `feat: add mobile nav parity for public home`

### Verification
- [ ] No horizontal scroll at 320/375/390/414/768.
- [ ] Keyboard-only flow works for close actions and guest card primary action.
- [ ] `npm run test:unit -- <new tests>` passes.
