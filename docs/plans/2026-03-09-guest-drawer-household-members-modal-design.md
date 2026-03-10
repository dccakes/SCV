# Guest Drawer Household Members Modal Design

## Goal

Enable household member management (add, edit, set primary, remove) from a dedicated modal launched from the guest drawer, while keeping contact/address/notes editing in the existing drawer edit surface.

## Product Boundaries

- Drawer remains the edit surface for `contact/address/notes` only.
- Party member operations move to a separate `Manage Household Members` modal.
- RSVP edits remain out of drawer and continue routing to Events.
- Removing the current primary contact is blocked until another guest is set primary.

## Chosen UX

- In drawer `Party Members` section, show `Manage members` action.
- Clicking opens a modal with member list editing controls:
  - add guest
  - edit guest fields (name and existing supported fields)
  - set primary contact
  - remove guest
- Guardrails:
  - cannot remove primary contact unless a different member is marked primary first
  - household must keep at least one member
- Modal has its own `Save` / `Cancel` lifecycle, independent of drawer footer save/discard.

## Data and State Model

- Keep current drawer draft for contact/address/notes unchanged.
- Add modal-local `memberDraft` state derived from selected household guest list.
- On modal save success:
  - patch selected household member data in UI immediately
  - keep drawer open
  - keep drawer contact/address/notes dirty state intact
  - call `router.refresh()` for server truth
- On modal save failure:
  - keep modal open
  - preserve `memberDraft`
  - show inline and/or toast error feedback

## Technical Direction

- Build a new client component for member-management modal under guest-list components.
- Reuse household update mutation path (`api.household.update`) with complete required payload fields.
- For update payload construction, always source canonical household data (not filtered event projection).
- Ensure primary-contact transitions are represented in payload by flipping `isPrimaryContact` across member list.

## UX Synchronization Requirements

- Drawer party list must refresh after modal save (e.g., adding a member shows immediately).
- If user has unsaved contact/address/notes edits in drawer, modal save must not reset or overwrite that drawer draft.
- If household selection changes, modal state must reset for the newly selected household.

## Error Handling

- Prevent invalid save when no primary contact is selected.
- Prevent invalid save when zero guests remain.
- Block remove action for primary with clear helper text/action hint.
- Preserve user input on mutation failure.

## Testing Strategy

### Unit tests (drawer + modal flow)

- open `Manage members` from drawer
- add member and save -> drawer member list updates
- set new primary then remove old primary -> allowed
- attempt remove current primary without reassignment -> blocked
- modal save failure -> draft persists and modal stays open
- modal save with dirty drawer draft -> drawer draft remains untouched

### Regression tests

- existing contact/address/notes save flow still works
- unsaved-close guard in drawer still works
- RSVP events-link flow unaffected

## Acceptance Criteria

- Users can add/edit/remove household members in a dedicated modal from drawer.
- Primary contact safety rule is enforced.
- Drawer party section reflects modal changes immediately after successful save.
- Contact/address/notes draft remains independent from member modal operations.
- All targeted unit tests pass.
