## ADDED Requirements

### Requirement: Global suggestion inbox page
The system SHALL provide a page at `/etta/pending` accessible to authenticated couples. The page SHALL display all suggestions for the wedding across all domains, ordered by `createdAt` descending.

#### Scenario: Couple navigates to /etta/pending
- **WHEN** an authenticated couple visits `/etta/pending`
- **THEN** all suggestions for their wedding are displayed, showing summary, domain, tier, actionType, and relative timestamp

#### Scenario: No suggestions exist
- **WHEN** a couple visits `/etta/pending` with no suggestions
- **THEN** an empty state is shown indicating Etta has no pending suggestions

### Requirement: Status-based filtering
The page SHALL allow filtering suggestions by status. The default view shows `pending` suggestions only. Available filters: All, Pending, Actioned, Failed.

#### Scenario: User filters to show failed suggestions
- **WHEN** the user selects the "Failed" filter
- **THEN** only suggestions with `status: failed` are shown, each displaying the `failureReason`

#### Scenario: User views all suggestions
- **WHEN** the user selects the "All" filter
- **THEN** suggestions across all statuses are shown, with status badges distinguishing pending / approved / actioned / failed / dismissed

### Requirement: Approve and dismiss from inbox
The page SHALL allow users to approve or dismiss any `pending` suggestion directly from the inbox. Approving a suggestion SHALL trigger background Etta execution. Dismissed suggestions SHALL be removed from the pending view.

#### Scenario: User approves a pending suggestion from inbox
- **WHEN** the user clicks "Approve" on a pending suggestion in `/etta/pending`
- **THEN** the suggestion status changes to `approved` and the item transitions to an "Etta is working on this…" state while background execution runs

#### Scenario: User dismisses a pending suggestion from inbox
- **WHEN** the user clicks "Dismiss" on a pending suggestion
- **THEN** the suggestion status changes to `dismissed` and the item is removed from the pending view

### Requirement: Retry failed suggestions
The page SHALL allow users to retry suggestions with `status: failed`. Retrying re-triggers background Etta execution with the original payload.

#### Scenario: User retries a failed suggestion
- **WHEN** the user clicks "Retry" on a failed suggestion
- **THEN** the suggestion status is reset to `approved` and background Etta execution is re-triggered

### Requirement: Tier visibility
Each suggestion SHALL display its tier (`T1` or `T2`) with a visual indicator. T2 suggestions (require explicit approval before external communication) SHALL be visually distinguished from T1.

#### Scenario: T2 suggestion displayed in inbox
- **WHEN** a T2 suggestion appears in the inbox
- **THEN** it is marked with a distinct badge (e.g. amber/red) indicating it involves outbound action requiring careful review
