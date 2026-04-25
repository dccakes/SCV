## ADDED Requirements

### Requirement: Approved suggestions trigger background Etta execution
When a suggestion is approved (via `/etta/pending` inbox or inline ghost item), the system SHALL trigger Etta in a background context. Etta SHALL receive the suggestion summary and payload as task context and SHALL use her existing tools to execute the action.

#### Scenario: Approved add_vendor suggestion is executed
- **WHEN** a suggestion with `actionType: add_vendor` is approved
- **THEN** background Etta is invoked with the payload, Etta calls the `add_vendor` tool, and the vendor is inserted into the wedding's vendor list

#### Scenario: Approved send_whatsapp_blast suggestion is executed
- **WHEN** a suggestion with `actionType: send_whatsapp_blast` is approved
- **THEN** background Etta is invoked with the payload, Etta triggers the WhatsApp blast to the specified recipients

### Requirement: Execution status transitions
The system SHALL update suggestion status based on Etta's execution outcome. On success, status SHALL transition to `actioned` and `executedAt` SHALL be set. On failure, status SHALL transition to `failed` and `failureReason` SHALL be populated with Etta's explanation.

#### Scenario: Etta executes suggestion successfully
- **WHEN** Etta's tool call succeeds during background execution
- **THEN** suggestion status becomes `actioned`, `executedAt` is set to the current timestamp

#### Scenario: Etta fails to execute suggestion
- **WHEN** Etta's tool call fails or Etta determines the action cannot be completed
- **THEN** suggestion status becomes `failed`, `failureReason` contains a human-readable explanation of what went wrong

### Requirement: Background execution does not create chat history
Background Etta execution SHALL NOT create entries in the wedding's chat history. Execution is a background operation, not a conversation turn. It SHALL be logged in the audit log with `actorType: etta`.

#### Scenario: Vendor added via background execution
- **WHEN** background Etta successfully adds a vendor from an approved suggestion
- **THEN** the vendor appears in the vendor list but no new message appears in the Etta chat history

### Requirement: Failed suggestions are retryable
Suggestions with `status: failed` SHALL be retryable from `/etta/pending`. Retrying SHALL re-trigger background Etta execution with the original payload and reset status to `approved`.

#### Scenario: User retries failed suggestion
- **WHEN** the user clicks "Retry" on a failed suggestion in `/etta/pending`
- **THEN** status resets to `approved`, background execution is re-triggered with the same payload

### Requirement: Execution is idempotent per approval
Each suggestion SHALL only trigger one background execution at a time. If a suggestion is already in `approved` state (execution in-flight), re-approving it SHALL NOT trigger a second execution.

#### Scenario: Double-approve race condition
- **WHEN** a user approves the same suggestion twice in rapid succession
- **THEN** only one background execution runs; the second approval is a no-op
