## ADDED Requirements

### Requirement: Domain pages show inline ghost items
Pages for domains with active pages (`vendors`, `guests`, `events`, `rsvp`) SHALL display pending suggestions relevant to their domain as inline ghost items within the relevant list or section. Ghost items are visually distinct from real items (dashed border, muted styling, Etta attribution label).

#### Scenario: Vendor page shows suggested vendor
- **WHEN** there is a pending suggestion with `domain: vendors` and `actionType: add_vendor`
- **THEN** the vendors list displays a ghost item at the bottom of the relevant vendor category section (using `payload.category` for placement), styled distinctly with "Etta suggests" label

#### Scenario: Guest page shows suggested follow-up
- **WHEN** there is a pending suggestion with `domain: guests` and `actionType: guest_followup`
- **THEN** the guest list displays a ghost item in the relevant section with a preview of the suggested action

#### Scenario: No pending suggestions for domain
- **WHEN** a domain page has no pending suggestions
- **THEN** no ghost items or suggestion UI is rendered on that page

### Requirement: Ghost items are actionable inline
Ghost items on domain pages SHALL include "Add" (approve) and "Skip" (dismiss) actions. Users SHALL be able to act on suggestions without navigating to `/etta/pending`.

#### Scenario: User approves ghost item inline
- **WHEN** the user clicks "Add" on a ghost item within a domain page
- **THEN** the ghost item disappears immediately (optimistic removal), the suggestion is approved, and background Etta execution is triggered

#### Scenario: User dismisses ghost item inline
- **WHEN** the user clicks "Skip" on a ghost item within a domain page
- **THEN** the ghost item disappears immediately and the suggestion is dismissed

### Requirement: Ghost items only show pending suggestions
Ghost items SHALL only render suggestions with `status: pending`. Approved, actioned, dismissed, and failed suggestions SHALL NOT appear as ghost items on domain pages. Their status can be reviewed in `/etta/pending`.

#### Scenario: Approved suggestion no longer shown as ghost item
- **WHEN** a suggestion transitions from `pending` to `approved` (after user clicks Add)
- **THEN** the ghost item is removed from the domain page and does not reappear

### Requirement: Nav badges show pending counts per domain
The sidebar navigation SHALL display a badge count on each nav item indicating the number of pending suggestions for that domain. The Etta nav entry SHALL show the total pending count across all domains.

#### Scenario: Vendors nav item shows pending count
- **WHEN** there are 2 pending suggestions with `domain: vendors`
- **THEN** the Vendors sidebar nav item displays a badge with "2"

#### Scenario: Badge disappears when no pending suggestions
- **WHEN** all pending suggestions for a domain are approved or dismissed
- **THEN** the badge on that nav item is removed

#### Scenario: Nav badge count updates after inline action
- **WHEN** a user approves or dismisses a ghost item on a domain page
- **THEN** the nav badge count for that domain decrements accordingly
