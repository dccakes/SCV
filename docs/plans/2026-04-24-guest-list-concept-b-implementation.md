# Guest List Concept B Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Guest List Concept B (selected `...9f74` direction) to support household, person-audit, and data-quality workflows with clear desktop/mobile behavior.

**Architecture:** Keep existing domain/mutation contracts intact and iterate UI in phases. Start with read-heavy control/list improvements, then improve drawer/form behavior, then finalize cross-flow consistency and regression coverage.

**Tech Stack:** Next.js, React, TypeScript, Tailwind, shadcn/ui, TRPC, Playwright, Vitest/RTL.

---

## Phase Plan Overview

1. PR1: Baseline + Guardrails
2. PR2: Unified Control Rail + Mode Switch + Filter State Clarity
3. PR3: Households and Person Audit Presentation Refinement
4. PR4: Drawer Hierarchy + Action Affordance + Dirty-State Safety
5. PR5: Guest Form Close-Safety + Cross-Flow Consistency
6. PR6: Final QA, Metrics Check, and Docs Update

---

## PR1: Baseline + Guardrails

### Objective
Capture current UX baseline and add regression safety before structural UI changes.

### Files
- Modify: `tests/e2e/guest-list.spec.ts`
- Modify: `tests/e2e/guest-list-drawer.spec.ts`
- Modify: `tests/unit/components/guest-list/guests-view.test.tsx`
- Modify: `tests/unit/components/guest-list/v2/list-toolbar.test.tsx`
- Create: `docs/plans/guest-list-concept-b-baseline-checklist.md`

### Tasks
- [ ] Add deterministic test assertions for current active sort/filter visibility behavior.
- [ ] Add E2E timing helper capture for key journeys:
  - open guest list
  - find household
  - open drawer
  - edit/save
  - open guest form
- [ ] Record baseline clicks/time in checklist doc.
- [ ] Ensure no existing guest-list tests are removed.

### Validation
- [ ] `pnpm test -- tests/unit/components/guest-list/v2/list-toolbar.test.tsx`
- [ ] `pnpm test -- tests/unit/components/guest-list/guests-view.test.tsx`
- [ ] `pnpm playwright test tests/e2e/guest-list.spec.ts`
- [ ] `pnpm playwright test tests/e2e/guest-list-drawer.spec.ts`

### Exit Criteria
- Baseline metrics/checklist committed.
- Core guest list and drawer suites pass reliably.

---

## PR2: Unified Control Rail + Mode Switch + Filter State Clarity

### Objective
Implement the core Concept B interaction model at the top of the page.

### Files
- Modify: `src/components/guest-list/guests-view.tsx`
- Modify: `src/components/guest-list/guest-search-filter.tsx`
- Modify: `src/components/guest-list/v2/list/list-toolbar.tsx`
- Modify: `tests/unit/components/guest-list/guests-view.test.tsx`
- Modify: `tests/unit/components/guest-list/v2/list-toolbar.test.tsx`

### Tasks
- [ ] Introduce explicit mode switch state in `GuestsView`:
  - `households` (default)
  - `personAudit`
- [ ] Consolidate list controls into a unified control rail structure (without breaking current actions).
- [ ] Replace ambiguous RSVP filter label (`Filter By`) with explicit semantics.
- [ ] Add active filter chips with per-chip remove and clear-all.
- [ ] Fix event-context reset behavior in `guest-search-filter.tsx` to be deterministic (no stale `[]` effect bug).
- [ ] Add explicit sort state indicator (field + direction).

### Validation
- [ ] Unit tests for mode switch rendering/state persistence.
- [ ] Unit tests for filter combinations + chip removal + clear-all.
- [ ] Unit tests for event context filter reset behavior.

### Exit Criteria
- User can always see mode, active filters, and active sort.
- Event changes do not leave hidden/stale filter state.

---

## PR3: Households and Person Audit Presentation Refinement

### Objective
Refine content presentation for both workflows while preserving existing data contracts.

### Files
- Modify: `src/components/guest-list/v2/list/guest-cards-list.tsx`
- Modify: `src/components/guest-list/v2/list/guest-card.tsx`
- Modify: `src/components/guest-list/v2/list/guest-individual-table.tsx`
- Modify: `src/components/guest-list/guests-view.tsx`
- Modify: `tests/unit/components/guest-list/v2/guest-card.test.tsx`
- Modify: `tests/unit/components/guest-list/v2/guest-cards-list.test.tsx`
- Modify: `tests/unit/components/guest-list/v2/list-toolbar.test.tsx`

### Tasks
- [ ] Reduce visual noise in household cards (hierarchy first, fewer competing micro-elements).
- [ ] Add clearer person-audit affordances in table/list view:
  - contact completeness
  - location completeness
- [ ] Ensure row/card selection affordance is explicit and consistent.
- [ ] Keep cards as default for household mode.

### Validation
- [ ] Unit tests for card and table rendering under empty/partial/full data.
- [ ] Verify selected household persistence when switching views/modes.

### Exit Criteria
- Household mode remains fast for group operations.
- Person mode is clearer for data audit workflows.

---

## PR4: Drawer Hierarchy + Action Affordance + Dirty-State Safety

### Objective
Make drawer editing clearer, less dense, and safer without changing backend ownership boundaries.

### Files
- Modify: `src/components/guest-list/guest-detail-panel-content.tsx`
- Modify: `src/components/guest-list/v2/drawer/guest-detail-drawer.tsx`
- Modify: `src/components/guest-list/v2/drawer/guest-detail-sections.tsx`
- Modify: `src/components/guest-list/household-members-modal.tsx`
- Modify: `src/components/guest-list/guests-view.tsx`
- Modify: `tests/unit/components/guest-list/v2/guest-detail-drawer.test.tsx`
- Modify: `tests/unit/components/guest-list/household-members-modal.test.tsx`
- Modify: `tests/unit/components/guest-list/guests-view.test.tsx`

### Tasks
- [ ] Improve section typography/spacing for scanability.
- [ ] Replace low-affordance tiny link-like edit actions with clearer button hierarchy.
- [ ] Keep sticky save/discard actions and add visible unsaved indicator near header/actions.
- [ ] Ensure modal edit/save cannot silently clobber drawer draft state.
- [ ] Strengthen destructive-action clarity in members modal (remove flow).

### Validation
- [ ] Dirty-state close guard test coverage.
- [ ] Drawer save/discard success/failure paths covered.
- [ ] Members modal save synchronization coverage.

### Exit Criteria
- No silent draft loss in drawer/modal pathways.
- Edit actions are obvious and easy to operate.

---

## PR5: Guest Form Close-Safety + Cross-Flow Consistency

### Objective
Align guest form side pane behavior with drawer safety and clarity patterns.

### Files
- Modify: `src/components/forms/guest-form.tsx`
- Modify: `src/components/forms/wrapper.tsx` (if needed for sticky/action behavior)
- Modify: `tests/unit/components/forms/guest-form.test.tsx`
- Modify: `tests/e2e/guest-list-drawer.spec.ts` (handoff path assertions)

### Tasks
- [ ] Add unsaved-close confirmation for guest form close button.
- [ ] Ensure close safety behavior matches drawer expectations.
- [ ] Improve section/action scanability for high-density form sections.
- [ ] Verify drawer-to-form handoff retains expected prefill and does not regress.

### Validation
- [ ] Unit tests for dirty-form close confirmation.
- [ ] E2E for drawer -> form edit -> cancel/save path continuity.

### Exit Criteria
- No silent data loss on guest form close.
- Cross-flow behavior feels consistent with drawer editing.

---

## PR6: Final QA + Metrics + Documentation

### Objective
Verify outcome against agreed success criteria and update planning artifacts.

### Files
- Modify: `docs/plans/2026-04-24-guest-list-concept-b-design.md`
- Modify: `docs/plans/guest-list-concept-b-baseline-checklist.md`
- Create: `docs/plans/2026-04-24-guest-list-concept-b-release-notes.md`

### Tasks
- [ ] Re-run baseline journey metrics and compare against PR1 baseline.
- [ ] Perform accessibility pass on modified surfaces.
- [ ] Document deltas, known limitations, and follow-up opportunities.

### Validation
- [ ] Full targeted unit + e2e suite for guest list paths green.
- [ ] Manual desktop/mobile spot checks completed.

### Exit Criteria
- Success metrics reviewed with product.
- Remaining gaps captured as explicit follow-up items.

---

## Execution Order and Dependencies

1. PR1 must land first.
2. PR2 depends on PR1 tests/metrics.
3. PR3 depends on PR2 mode/control model.
4. PR4 depends on PR2/PR3 UI state stabilization.
5. PR5 depends on PR4 safety patterns.
6. PR6 closes the loop.

---

## Definition of Done (Whole Initiative)

- [ ] Households workflow remains card-first and faster to scan/edit.
- [ ] Person audit workflow is explicit and practical for tags/completeness checks.
- [ ] Active filter/sort/mode state is always visible.
- [ ] Mobile supports both workflows without desktop-table dependence.
- [ ] No silent unsaved data loss in drawer or guest form.
- [ ] Targeted tests and baseline comparisons are documented and green.

---

## Suggested Commit Cadence

- Commit per PR-level milestone + one commit for tests within each PR.
- Prefer focused commit messages:
  - `feat(guest-list): unify control rail and mode switch`
  - `feat(guest-list): add active filter chips and deterministic reset`
  - `feat(guest-list): refine person audit presentation`
  - `feat(guest-drawer): improve hierarchy and dirty-state affordance`
  - `feat(guest-form): add unsaved close guard`
  - `test(guest-list): expand regression coverage for concept-b flows`

