## ADDED Requirements

### Requirement: Etta can fetch category field definitions
Etta SHALL have a `get_category_config` tool that returns the active field definitions for a given vendor category (wedding-specific override if it exists, otherwise system default).

#### Scenario: Etta retrieves field definitions for a category
- **WHEN** Etta calls `get_category_config` with a valid `VendorCategory`
- **THEN** the tool returns the ordered array of field definitions (key, label, type) for that category

#### Scenario: Wedding-specific config is returned when it exists
- **WHEN** the couple's wedding has a custom config for the requested category
- **THEN** Etta receives the wedding-specific definitions, not the system default

---

### Requirement: Etta can update vendor-level fields
Etta SHALL have an `update_vendor` tool that allows direct (non-suggestion) updates to `contacted`, `notes`, and `customFields` on a vendor. This tool executes immediately, consistent with `update_vendor_quote`.

#### Scenario: Etta marks a vendor as contacted
- **WHEN** Etta calls `update_vendor` with `{ contacted: true }` for a valid vendorId
- **THEN** the vendor's `contacted` field is set to `true`

#### Scenario: Etta sets custom field values on a vendor
- **WHEN** Etta calls `update_vendor` with `customFields: { max_guests: "250" }` for a valid vendorId
- **THEN** the vendor's `customFields` is updated with the provided key-value pairs (merged, not replaced)

#### Scenario: Etta updates vendor notes
- **WHEN** Etta calls `update_vendor` with a `notes` string for a valid vendorId
- **THEN** the vendor's `notes` field is updated

#### Scenario: Etta cannot update vendor fields for a vendor outside the couple's wedding
- **WHEN** Etta calls `update_vendor` with a vendorId not belonging to the active wedding
- **THEN** the tool returns an authorization error

---

### Requirement: Etta can add entries to the vendor interaction log
Etta SHALL have an `add_vendor_note` tool that appends a timestamped entry to the `VendorNote` table with `actorType: 'etta'`.

#### Scenario: Etta adds a note to a vendor's interaction log
- **WHEN** Etta calls `add_vendor_note` with a vendorId and message
- **THEN** a `VendorNote` entry is created attributed to Etta and visible in the couple's interaction log

#### Scenario: Etta cannot add a note to a vendor outside the couple's wedding
- **WHEN** Etta calls `add_vendor_note` with a vendorId not belonging to the active wedding
- **THEN** the tool returns an authorization error and no entry is created

---

### Requirement: Etta can suggest new category fields via the suggestion system
Etta SHALL be able to propose a new field definition for a vendor category using the existing `EttaSuggestion` system with a new action type `SUGGEST_VENDOR_FIELD`. Etta MUST NOT create or modify `VendorCategoryConfig` directly.

#### Scenario: Etta suggests a new field for a category
- **WHEN** Etta determines a useful field is missing from a category's definitions
- **THEN** Etta creates an `EttaSuggestion` with action `SUGGEST_VENDOR_FIELD`, tier T2, and payload `{ category, key, label, type, reason }`

#### Scenario: Couple approves a field suggestion
- **WHEN** the couple approves the `SUGGEST_VENDOR_FIELD` suggestion
- **THEN** the proposed field is appended to the wedding's `VendorCategoryConfig` for that category (creating an override from the system default if one doesn't exist)

#### Scenario: Couple rejects a field suggestion
- **WHEN** the couple rejects the `SUGGEST_VENDOR_FIELD` suggestion
- **THEN** no change is made to any `VendorCategoryConfig`

---

### Requirement: get_vendor_list includes new vendor fields
The existing `get_vendor_list` Etta tool SHALL include `contacted`, `notes`, and `customFields` in each vendor object returned.

#### Scenario: Vendor list response includes enriched fields
- **WHEN** Etta calls `get_vendor_list`
- **THEN** each vendor in the response includes `contacted` (boolean), `notes` (string or null), and `customFields` (object or null)
