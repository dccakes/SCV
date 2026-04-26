### Requirement: Vendor tracks whether outreach has been made
The `Vendor` model SHALL have a `contacted` boolean field (default `false`) indicating whether the couple has reached out to the vendor for a quote or conversation. This is independent of `VendorStatus` which tracks the selection lifecycle.

#### Scenario: New vendor defaults to not contacted
- **WHEN** a vendor is created
- **THEN** `contacted` is `false`

#### Scenario: Couple marks a vendor as contacted
- **WHEN** a couple toggles `contacted` to `true` for a vendor they own
- **THEN** the field is persisted and returned as `true` in subsequent queries

#### Scenario: Couple can unmark a vendor as contacted
- **WHEN** a couple sets `contacted` to `false` for a previously contacted vendor
- **THEN** the field is persisted as `false`

#### Scenario: Couple cannot update contacted on a vendor they do not own
- **WHEN** a couple attempts to update `contacted` for a vendor belonging to a different wedding
- **THEN** the system returns an authorization error and no change is made

#### Scenario: Contacted status is included in vendor list responses
- **WHEN** a couple fetches their vendor list
- **THEN** each vendor includes the `contacted` boolean field
