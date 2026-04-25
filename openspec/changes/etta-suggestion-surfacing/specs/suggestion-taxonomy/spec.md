## ADDED Requirements

### Requirement: Domain enum field on EttaSuggestion
The system SHALL add a `domain` field to `EttaSuggestion` with the following valid values: `guests | events | rsvp | vendors | budget | tasks | other`. This field is required and must be provided by Etta when creating a suggestion. Suggestions with domain `other` SHALL only appear in the global `/etta/pending` inbox.

#### Scenario: Etta creates suggestion with valid domain
- **WHEN** Etta calls `create_suggestion` with a valid domain value (e.g. `vendors`)
- **THEN** the suggestion is stored with that domain and appears on the corresponding domain page

#### Scenario: Etta creates suggestion with domain 'other'
- **WHEN** Etta calls `create_suggestion` with `domain: other`
- **THEN** the suggestion is stored and appears only in `/etta/pending`, not on any domain page

### Requirement: Controlled actionType enum
The system SHALL constrain `actionType` to a defined set of values. Valid values are: `add_vendor | upsert_budget_item | send_whatsapp_blast | draft_vendor_email | suggest_venue_visit | guest_followup | other`. The `create_suggestion` tool description SHALL enumerate these values so Etta selects the closest match.

#### Scenario: Etta selects a known actionType
- **WHEN** Etta calls `create_suggestion` with `actionType: add_vendor`
- **THEN** the suggestion is stored with that actionType and the UI can render it with the appropriate ghost item template

#### Scenario: Etta uses other for an unclassified action
- **WHEN** no existing actionType fits Etta's intent
- **THEN** Etta MAY use `actionType: other`, and the suggestion appears in `/etta/pending` with a generic display

### Requirement: Extended status lifecycle
The system SHALL support the following `EttaSuggestion` status values: `pending | approved | dismissed | actioned | failed`. The `actioned` status indicates Etta successfully executed the suggestion after approval. The `failed` status indicates Etta attempted execution but encountered an error.

#### Scenario: Suggestion is successfully executed after approval
- **WHEN** a suggestion is approved and Etta executes it successfully
- **THEN** status transitions to `actioned` and `executedAt` is set

#### Scenario: Suggestion execution fails after approval
- **WHEN** a suggestion is approved and Etta's execution fails
- **THEN** status transitions to `failed`, `failureReason` is populated with Etta's explanation, and the suggestion remains visible in `/etta/pending` with a retry option

### Requirement: Payload carries execution context
Each actionType SHALL have a documented payload shape that contains sufficient data for Etta to execute the action without prompting the user again. The payload is Etta's briefing at suggestion time.

#### Scenario: add_vendor payload enables vendor creation
- **WHEN** a suggestion with `actionType: add_vendor` is approved
- **THEN** the payload contains at minimum `name` and `category`, enabling Etta to call `add_vendor` tool without additional input

#### Scenario: send_whatsapp_blast payload enables message send
- **WHEN** a suggestion with `actionType: send_whatsapp_blast` is approved
- **THEN** the payload contains `message` and optional `recipientFilter`, enabling Etta to trigger the blast
