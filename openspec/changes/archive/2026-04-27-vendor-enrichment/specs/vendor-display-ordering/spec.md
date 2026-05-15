## ADDED Requirements

### Requirement: Vendors within a category are sorted by status priority
Within each category section, the client SHALL sort vendors by a status priority order before rendering. Sorting is client-side only; the server sort (`category asc, createdAt asc`) is unchanged.

Status priority order (ascending, lower = higher in list):
- `SELECTED`: 0
- `IN_NEGOTIATION`: 1
- `PRE_SELECTED`: 2
- `IN_REVIEW`: 3
- `NOT_AVAILABLE`: 4
- `DECLINED`: 5

#### Scenario: SELECTED vendor appears before IN_REVIEW vendor in the same category
- **WHEN** a category contains a SELECTED vendor and an IN_REVIEW vendor added earlier
- **THEN** the SELECTED vendor renders first regardless of creation order

#### Scenario: Active vendors (priority 0–3) sort among themselves by status priority
- **WHEN** a category contains vendors with statuses SELECTED, PRE_SELECTED, and IN_REVIEW
- **THEN** they appear in order: SELECTED, PRE_SELECTED, IN_REVIEW

---

### Requirement: Bottom-group vendors sort by most recently updated
Vendors with status `NOT_AVAILABLE` (priority 4) or `DECLINED` (priority 5) SHALL be sorted within the bottom group by `updatedAt` descending — the most recently touched vendor appears first among the deactivated vendors.

#### Scenario: Most recently declined vendor appears first in the bottom group
- **WHEN** a category has two DECLINED vendors, one updated today and one updated last week
- **THEN** the one updated today appears first

#### Scenario: NOT_AVAILABLE vendors appear before DECLINED vendors
- **WHEN** a category contains both NOT_AVAILABLE and DECLINED vendors
- **THEN** all NOT_AVAILABLE vendors render before all DECLINED vendors (priority 4 < 5)

---

### Requirement: DECLINED and NOT_AVAILABLE vendor cards are visually deactivated
Vendor cards with status `DECLINED` or `NOT_AVAILABLE` SHALL render with a visually muted appearance to distinguish them from active vendors.

#### Scenario: Declined vendor card is visually deactivated
- **WHEN** a vendor card has status DECLINED or NOT_AVAILABLE
- **THEN** the card renders with reduced opacity and/or grayscale styling to signal it is inactive

#### Scenario: Active vendor cards are unaffected
- **WHEN** a vendor card has any status other than DECLINED or NOT_AVAILABLE
- **THEN** the card renders with full color and normal opacity
