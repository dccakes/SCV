## ADDED Requirements

### Requirement: Vendor has a scratchpad notes field
The `Vendor` model SHALL have a nullable `notes` field (plain text, no length limit enforced at DB level) for quick couple-authored impressions or context about the vendor.

#### Scenario: Couple saves notes on a vendor
- **WHEN** a couple submits updated notes text for a vendor they own
- **THEN** the `notes` field is persisted and returned in subsequent vendor queries

#### Scenario: Notes field is optional
- **WHEN** a vendor is created without notes
- **THEN** `notes` is null and the vendor is valid

#### Scenario: Notes can be cleared
- **WHEN** a couple saves an empty string or null for notes
- **THEN** the field is set to null

---

### Requirement: Vendor has a timestamped interaction log
The system SHALL maintain a `VendorNote` table recording timestamped log entries per vendor. Both the couple and Etta can append entries. Entries are immutable once created (no edit or delete).

#### Scenario: Couple adds an interaction note
- **WHEN** a couple submits a message for a vendor they own
- **THEN** a `VendorNote` entry is created with `actorType: 'couple'` and the current timestamp

#### Scenario: Etta adds an interaction note
- **WHEN** Etta calls `add_vendor_note` with a vendorId and message
- **THEN** a `VendorNote` entry is created with `actorType: 'etta'` and the current timestamp

#### Scenario: Notes are returned in descending chronological order
- **WHEN** the interaction log for a vendor is fetched
- **THEN** entries are ordered by `createdAt` descending (newest first)

#### Scenario: Couple cannot add a note to a vendor they do not own
- **WHEN** a couple submits a note for a vendorId belonging to a different wedding
- **THEN** the system returns an authorization error and no entry is created

#### Scenario: Empty message is rejected
- **WHEN** a note is submitted with an empty or whitespace-only message
- **THEN** the system returns a validation error and no entry is created
