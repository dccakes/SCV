# Guest Drawer Display/Edit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Simplify the guest side drawer to only two modes (`display` and `edit`) while keeping the existing full-editor save path as the primary completion flow.

**Architecture:** Replace boolean edit state with an explicit mode union in `GuestsView`, split editable drawer content into focused section components, and keep non-editable sections display-only. Preserve draft prefill + "Continue in Full Editor" behavior behind a single primary-action seam so direct drawer save can be added later.

**Tech Stack:** React 19, TypeScript, Next.js client components, Tailwind CSS, Jest + Testing Library.

---

### Task 1: Update mode model and footer actions in GuestsView

**Files:**
- Modify: `src/components/guest-list/guests-view.tsx`
- Test: `tests/unit/components/guest-list/guests-view.test.tsx`

**Steps:**
1. Replace `isDrawerEditMode` with `drawerMode: 'display' | 'edit'` and update all state transitions.
2. Add/rename the primary action handler seam used in edit mode (currently routes to full editor continuation).
3. Normalize footer actions to:
   - display: `Edit` + `Open Full Editor`
   - edit: `Cancel` + `Continue in Full Editor`
4. Ensure close/select/reset transitions always return to `display` mode.

### Task 2: Refactor drawer panel content into clear display/edit sections

**Files:**
- Modify: `src/components/guest-list/guest-detail-panel-content.tsx`

**Steps:**
1. Update props from boolean edit flag to `drawerMode` union.
2. Extract contact/address rendering into explicit display/edit subsection components in-file (or local helper components).
3. Extract notes rendering into explicit display/edit subsection components.
4. Keep RSVP summary, party members, seating/event, and communication log as display-only.
5. Remove "Change" action in RSVP summary row.

### Task 3: Add tests for two-mode behavior and continuation flow

**Files:**
- Modify: `tests/unit/components/guest-list/guests-view.test.tsx`

**Steps:**
1. Add a test that drawer opens in display mode with read-only values.
2. Add a test that switching to edit mode reveals editable inputs and `Continue in Full Editor`.
3. Add a test that cancel from edit mode restores display mode and resets draft values.
4. Add a test that continue-from-edit sends draft changes through prefill and triggers full editor.

### Task 4: Verify and stabilize

**Files:**
- Verify: `tests/unit/components/guest-list/guests-view.test.tsx`
- Verify: `tests/unit/components/guest-list/v2/guest-detail-drawer.test.tsx`

**Steps:**
1. Run focused unit tests for updated drawer/guest view.
2. Fix any failures with minimal changes.
3. Run lint for touched files scope if needed.
4. Prepare a concise changelog for handoff (no commit).
