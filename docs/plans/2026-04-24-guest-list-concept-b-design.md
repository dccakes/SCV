# Guest List Concept B Design Spec

## Goal

Deliver a cleaner, more intuitive Guest List experience that supports three distinct jobs-to-be-done without forcing users into one view pattern:

1. Household workflow (group-level editing and review)
2. Person workflow (person-level tags and RSVP auditing)
3. Data quality workflow (identify and fix missing information)

Concept baseline selected by product review: **mockup ending in `...9f74`**.

---

## Why This Direction

Current Guest List UX is functional but dense. It requires users to mentally stitch together controls and state across multiple rows and surfaces. The selected Concept B direction improves clarity while preserving current data model and most interaction contracts.

This is a medium-structural refinement, not a ground-up rewrite.

---

## Product Jobs-To-Be-Done

### JTBD 1: Manage households quickly

As a planner, I want to find and edit a household as a single unit, so I can update shared details and group-level context without scanning person-by-person rows.

Primary UX support:
- Household mode (cards-first)
- Fast search + chips + quick edit drawer

### JTBD 2: Audit person-level details

As a planner, I want to inspect each individual guest (tags, RSVP, contact status), so I can run person-level workflows like children tagging and RSVP follow-up.

Primary UX support:
- Person Audit mode (table/list-first)
- Person-level columns and completeness indicators

### JTBD 3: Improve data completeness

As a planner, I want to quickly identify missing contact/location data, so I can clean records before segmentation, invitations, and downstream workflows.

Primary UX support:
- Preset chips (e.g. Missing Contact Info)
- Explicit completeness status in list rows

---

## Scope

### In scope
- Unified control rail for list operations and primary actions
- Explicit mode switch: `Households` and `Person Audit`
- Active filter state chips with clear/remove interactions
- Cleaner drawer hierarchy and stronger action affordance
- Mobile adaptation of both modes
- Safety fixes for unsaved changes and filter state behavior

### Out of scope (this phase)
- New backend domain objects or schema changes
- Bulk action execution engine (UI placeholders can exist later)
- Virtualized “ops workspace” redesign (Concept C)
- Moving RSVP ownership out of Events domain

---

## Information Architecture

### Top-level Guest List IA

1. Event context tabs (existing)
2. Unified control rail
3. Mode content area
- Households mode: card grid (default)
- Person Audit mode: table/list
4. Detail surface
- Desktop: side drawer/pane
- Mobile: full-screen drawer

### Control rail IA

Left:
- Search input
- Preset chips
- Filter entrypoint
- Active filter chips

Right:
- Sort control (explicit field + direction)
- View style toggle (cards/table where applicable)
- `Import Guests`
- `Add Guest` (primary)

---

## UX Spec (Desktop)

### 1) Unified Control Rail

Replace fragmented rows with one coherent control zone.

Rules:
- All list-affecting controls are visible in one place.
- Active filter state is always visible as removable chips.
- Sort state must show current field and direction.
- Primary actions (`Add Guest`) remain visually dominant.

### 2) Mode switch

Introduce explicit mode control:
- `Households` (default)
- `Person Audit`

Rules:
- Switching modes preserves current search/filter context.
- Mode switch does not discard unsaved drawer data; if dirty, show close guard.

### 3) Households mode

- Keep cards-first experience for group editing.
- Cards show concise hierarchy: primary contact, party size, RSVP summary, key tags, location status.
- Card density reduced vs current badge-heavy presentation.

### 4) Person Audit mode

- Table/list-first presentation with person-level records.
- Required columns:
  - Person
  - Household
  - Tags
  - RSVP
  - Contact completeness
  - Location completeness
- Missing data gets explicit visual markers.

### 5) Detail drawer/pane

- Keep existing sections but improve readability and action clarity.
- Replace tiny link-like actions with clear button affordances.
- Show unsaved changes status near actions.
- Sticky save/discard actions remain at bottom when dirty.

---

## UX Spec (Mobile)

### Global principles
- Card-first remains the default for mobile
- Controls compacted, not removed
- Person Audit uses stacked rows instead of wide tables

### Mobile Households mode
- Compact sticky top row: search, filter, add
- Horizontal preset chips
- Household cards with overflow actions
- Full-screen detail drawer

### Mobile Person Audit mode
- Stacked person rows with compact completeness indicators
- Filter/sort in bottom sheet
- Full-screen detail drawer with section anchors/chips
- Sticky save/discard actions in drawer when dirty

---

## Filtering and State Semantics

### Filter model
- Filters can combine across dimensions: RSVP, tag, country, search
- All active filters shown as chips
- Any chip removable independently
- `Clear all` resets all filters and search

### Event context behavior
- Filter state reset behavior must be deterministic and explicit on event context change
- Existing fragile behavior in `guest-search-filter.tsx` must be fixed

### Presets
Initial presets:
- `Manage Households`
- `Tag Cleanup`
- `Missing Contact Info`
- `Children Audit`

Preset behavior:
- Applies a known filter/sort/mode bundle
- Shows resulting active chips/state explicitly

---

## Visual and Content Guidelines

- Prioritize readability over decorative micro-labels
- Avoid overuse of tiny mono uppercase text in dense zones
- Ensure action hierarchy is obvious (primary/secondary/destructive)
- Use concise, explicit labels (avoid generic `Filter By`)

---

## Interaction Safety Requirements

1. Unsaved changes must never be lost silently on drawer/form close.
2. Section edits should have clear persistence boundaries.
3. Destructive actions (delete/remove) must remain separated and clear.
4. Mode switches and filter changes must not cause implicit hidden data loss.

---

## Accessibility Requirements

- All controls keyboard reachable with visible focus
- Action buttons meet 44x44 target on touch surfaces
- State communicated by more than color alone
- Drawer and filter overlays maintain correct focus management and escape behavior

---

## Implementation Phases

### Phase 0: Baseline + guardrails
- Add journey timing and deterministic UI-state assertions
- Protect regression-sensitive areas before structural changes

### Phase 1: Control rail + mode + filter clarity
- Build unified control rail
- Add explicit mode switch and active chips
- Fix event-change reset semantics

### Phase 2: List and drawer polish
- Improve card/table hierarchy
- Improve drawer action affordance and visual density

### Phase 3: Form parity and cross-flow consistency
- Align guest form close safety and action clarity with drawer
- Ensure coherent behavior across drawer and side pane edit flows

---

## Acceptance Criteria

1. User can identify active filters and sort state at a glance.
2. User can switch between household and person workflows without confusion.
3. Missing contact/location data is discoverable without opening each household.
4. Mobile supports both workflows cleanly without desktop-table dependence.
5. No silent unsaved data loss on close/switch interactions.
6. Existing guest update flows continue to function without schema changes.

---

## Success Metrics

- Reduce time-to-target-household from current baseline by >= 20%
- Reduce clicks to run common audit task (e.g., find children with missing contact info) by >= 30%
- Zero critical regressions in guest list + drawer E2E coverage
- Subjective UX score improvement from ~6.8 to >= 8.0 in internal review

---

## File Targets (Planned)

Primary implementation files:
- `src/components/guest-list/guests-view.tsx`
- `src/components/guest-list/guest-search-filter.tsx`
- `src/components/guest-list/v2/list/list-toolbar.tsx`
- `src/components/guest-list/v2/list/guest-cards-list.tsx`
- `src/components/guest-list/v2/list/guest-individual-table.tsx`
- `src/components/guest-list/v2/list/guest-card.tsx`
- `src/components/guest-list/guest-detail-panel-content.tsx`
- `src/components/guest-list/v2/drawer/guest-detail-drawer.tsx`
- `src/components/forms/guest-form.tsx`

Test targets:
- `tests/e2e/guest-list.spec.ts`
- `tests/e2e/guest-list-drawer.spec.ts`
- `tests/unit/components/guest-list/guests-view.test.tsx`
- `tests/unit/components/guest-list/v2/list-toolbar.test.tsx`

---

## Risks and Mitigations

1. **Risk:** Filter/mode state coupling creates inconsistent results.
- **Mitigation:** Centralize state derivation and add combinational tests.

2. **Risk:** UI polish changes regress existing edit flows.
- **Mitigation:** Preserve mutation contracts; stage rollout by read-heavy surfaces first.

3. **Risk:** Mobile parity lags desktop changes.
- **Mitigation:** Build each control/state path mobile-first-compatible during Phase 1.

---

## Decision Log

- Chosen concept: **Concept B, aligned to image `...9f74`**
- Reason: best balance of clarity, implementation risk, and preservation of existing mental models (cards for households, table/list for person auditing)

