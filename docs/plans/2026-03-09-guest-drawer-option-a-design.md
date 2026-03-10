# Guest Drawer Option A Design

## Goal

Make the guest drawer the single edit surface for existing household profile data (contact, address, notes), keep guest addition in a separate modal flow, and route RSVP management to Events pages.

## Product Boundaries

- Editable in drawer: contact, address, notes.
- Not editable in drawer: RSVP data, party-member composition, communication log, seating/event summaries.
- Add Guest remains a separate modal flow.
- RSVP ownership lives in Events. Drawer shows RSVP status and a navigation CTA to Events.

## Chosen Approach

Option A is selected:

- Direct save in drawer for contact/address/notes.
- No update-time full-editor path for existing households.
- RSVP section becomes read-only with `Manage RSVPs in Events` CTA.

This approach is preferred because it keeps ownership boundaries explicit, reduces interaction complexity, and minimizes implementation risk while still removing the current full-editor dependency for routine profile edits.

## UX and Interaction Model

### Section editing

- Replace a global edit mode with section-scoped editing controls.
- Supported editable sections: `contactAddress`, `notes`.
- Each editable section has a pencil action to enter edit state.
- Non-editable sections remain display-only and have no edit controls.

### Dirty-state actions

- Keep a single `drawerDraft` and a `baselineSnapshot` for editable fields.
- Compute `isDirty` from editable fields only.
- Show footer action bar only when dirty:
  - `Discard changes`
  - `Save changes` (primary)

### Close guard

- Intercept drawer close when `isDirty` is true.
- Confirm options:
  - `Keep editing`
  - `Discard and close`
- Close immediately when not dirty.

### RSVP navigation

- RSVP area remains display-only.
- Replace any RSVP change affordance with `Manage RSVPs in Events`.
- Navigation behavior:
  - If a single relevant event is known, deep-link to that event context.
  - If event context is ambiguous, route to Events index with query/filter context.

## Technical Design

### State and data flow

- In `GuestsView`, maintain:
  - `drawerDraft` as the mutable source for editable fields.
  - `baselineSnapshot` for dirty comparison.
  - `editingSections` as `Set<'contactAddress' | 'notes'>`.
- Derive `isDirty` via field-level comparison between draft and baseline for contact/address/notes.

### Save path

- Use `api.household.update.useMutation` for direct drawer persistence.
- Build a constrained payload mapper from selected household + draft:
  - include updated contact/address/notes.
  - preserve required non-edited schema fields.
- Success behavior:
  - clear dirty/editing states.
  - keep drawer open and reflect updated values immediately.
  - trigger `router.refresh()` and success toast.
- Error behavior:
  - preserve draft and editing state.
  - show error toast.

### Full-editor decoupling

- Remove existing-household update actions that open/continue full editor.
- Remove update-time prefill flows tied to existing household edits.
- Keep full editor for add/new flow only.

## Test Strategy

Focus on behavior tests in `tests/unit/components/guest-list/guests-view.test.tsx`:

- section-level pencil toggles for editable sections.
- dirty footer visibility and button behavior.
- discard resets draft to baseline.
- successful save persists and clears dirty/edit states.
- failed save retains draft/edit state.
- unsaved-close guard behavior.
- RSVP CTA routes to Events path and no drawer RSVP edit action is present.
- no update-time full-editor actions are shown for existing households.

## Risks and Mitigations

- Event-link ambiguity (multiple events): route to Events index with context instead of guessing one event.
- Payload drift against update schema: centralize payload mapping in one function and cover with tests.
- Perceived stale UI after save: patch local display state on success before/alongside refresh.

## Acceptance Criteria

- Existing households can edit and save contact/address/notes entirely inside drawer.
- Existing households cannot trigger full-editor update flow from drawer.
- RSVP content is display-only in drawer with working CTA to Events.
- Unsaved-change close guard prevents accidental data loss.
- Unit tests cover the new behavior boundaries.
