### Requirement: Category field definitions exist at system and wedding level
The system SHALL maintain a `VendorCategoryConfig` table that defines custom field schemas per vendor category. A row with `weddingId = null` is the system default. A row with a specific `weddingId` is a wedding-level override for that category.

#### Scenario: System defaults exist for all 7 categories on startup
- **WHEN** the application is seeded
- **THEN** `VendorCategoryConfig` rows exist with `weddingId = null` for VENUE, CATERING, PHOTOGRAPHER, VIDEOGRAPHER, MUSIC, FLOWERS, and OTHER

#### Scenario: Wedding falls back to system default when no override exists
- **WHEN** a couple's wedding has no `VendorCategoryConfig` for a given category
- **THEN** the system returns the system default config for that category

#### Scenario: Wedding override takes full precedence
- **WHEN** a couple's wedding has a `VendorCategoryConfig` for a given category
- **THEN** the system returns the wedding-specific config, ignoring the system default entirely

#### Scenario: Couple creates a wedding override from the system default
- **WHEN** a couple requests to customize a category's fields for the first time
- **THEN** the system copies the system default field definitions into a new wedding-specific row, which the couple can then modify

#### Scenario: Only one config per wedding per category
- **WHEN** a wedding-level config for a category already exists and a new one is submitted
- **THEN** the existing row is updated (upsert), not duplicated

---

### Requirement: Field definitions are an ordered array of typed fields
Each `VendorCategoryConfig.fieldDefinitions` SHALL be a JSON array of field definition objects. Each object SHALL have: `key` (unique string identifier), `label` (display name), `type` (`'text' | 'number' | 'boolean'`), and `displayOrder` (integer).

#### Scenario: Valid field definition is accepted
- **WHEN** a field definition includes key, label, a valid type, and displayOrder
- **THEN** it is stored without error

#### Scenario: Invalid field type is rejected
- **WHEN** a field definition uses a type other than text, number, or boolean
- **THEN** the system returns a validation error

#### Scenario: Duplicate keys within a config are rejected
- **WHEN** two field definitions in the same config share the same key
- **THEN** the system returns a validation error

---

### Requirement: Vendors store custom field values as JSON
The `Vendor` model SHALL have a nullable `customFields` JSON field storing key-value pairs. Keys correspond to field definition `key` values from the category's config. Values are stored as strings regardless of field type; display layer interprets by type.

#### Scenario: Vendor custom fields are set
- **WHEN** a couple updates `customFields` on a vendor with valid key-value pairs
- **THEN** the values are persisted and returned in subsequent vendor queries

#### Scenario: Custom fields are optional
- **WHEN** a vendor has no custom fields set
- **THEN** `customFields` is null and the vendor is valid

#### Scenario: Custom fields are included in vendor list responses
- **WHEN** a couple fetches their vendor list
- **THEN** each vendor includes the `customFields` object (or null)

#### Scenario: Unknown keys are stored without error
- **WHEN** a vendor's customFields contains a key not present in the category config
- **THEN** the value is stored without error (no strict key validation at persistence layer)
