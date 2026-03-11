# PR2: OSWP UI Consistency Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align shared UI primitives and state feedback patterns to OSWP visual language and behavior consistency.

**Architecture:** Stabilize at primitives first (button/input/card/dialog), then remove conflicting legacy helper styles, then standardize async state UX.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS, shadcn primitives, Jest + RTL.

---

### Task 1: Add red tests for primitive class contracts

**Files:**
- Create: `tests/unit/components/ui/button.oswp.test.tsx`
- Create: `tests/unit/components/ui/input.oswp.test.tsx`
- Optional: `tests/unit/components/ui/card.oswp.test.tsx`

- [ ] Write failing tests for radius/type/spacing class expectations.
- [ ] Run tests to confirm red.
- [ ] Commit: `test: cover oswp primitive style contracts`

### Task 2: Align core primitives to OSWP

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/textarea.tsx`
- Modify: `src/components/ui/select.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/dialog.tsx`
- Modify (if needed): `src/styles/globals.css`

- [ ] Apply OSWP geometry and typography rules consistently.
- [ ] Keep variants backward-compatible where possible.
- [ ] Re-run primitive and impacted component tests.
- [ ] Commit: `refactor: align ui primitives with oswp system`

### Task 3: Remove conflicting legacy style helpers

**Files:**
- Modify: `src/app/utils/shared-styles.ts`

- [ ] Replace ad-hoc button/surface helpers with primitive variants or token-safe mappings.
- [ ] Remove hardcoded utility patterns that conflict with OSWP tokens.
- [ ] Re-run related component tests.
- [ ] Commit: `refactor: normalize shared style helpers to oswp tokens`

### Task 4: Standardize async feedback states

**Files:**
- Create: `src/components/ui/async-state.tsx` (or split loading/empty/error components)
- Modify: `src/app/_components/website/forms/main.tsx`
- Modify: `src/app/_components/forms/question-form.tsx`
- Modify: `src/app/_components/forms/rsvp-form-settings.tsx`
- Modify: `src/components/guest-list/self-invite-link-manager.tsx`
- Modify: `src/components/guest-list/guests-view.tsx`

**Tests:**
- Create: `tests/unit/components/ui/async-state.test.tsx`

- [ ] Write failing tests for consistent rendering of loading/empty/error.
- [ ] Replace `window.alert` usage with toast/inline `aria-live` messaging.
- [ ] Adopt shared state component in async UI zones.
- [ ] Commit: `fix: standardize async feedback patterns across ui`

### Verification
- [ ] Primitive tests pass.
- [ ] No `window.alert` remains in targeted UI flows.
- [ ] Visual consistency check in guest list, forms, and dialogs complete.
