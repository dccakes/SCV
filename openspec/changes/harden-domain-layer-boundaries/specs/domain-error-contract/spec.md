# Spec Delta

## Purpose

Defines how business rule failures raised by domain and application code reach API clients and server side callers, so error codes stay stable no matter which transport invokes the business logic.

## ADDED Requirements

### Requirement: Each failure category maps to one stable API error code
Business rule failures SHALL fall into these categories, each returned to tRPC clients with a fixed code: not found → `NOT_FOUND`; forbidden → `FORBIDDEN`; conflict → `CONFLICT`; validation → `BAD_REQUEST`; precondition failed → `PRECONDITION_FAILED`; invariant violation → `INTERNAL_SERVER_ERROR`.

#### Scenario: Missing resource
- **WHEN** a coordinator requests a guest id that does not exist in their wedding
- **THEN** the tRPC response carries the `NOT_FOUND` code

#### Scenario: No active wedding selected
- **WHEN** an authenticated user with no active wedding calls a wedding-scoped procedure
- **THEN** the tRPC response carries the `PRECONDITION_FAILED` code

### Requirement: Existing error codes and messages are preserved
For every failure the system reports today, the code and the user-facing message returned to tRPC clients SHALL stay the same after this change.

#### Scenario: Event outside wedding scope keeps its message
- **WHEN** a coordinator creates a household that invites a guest to an event from another wedding
- **THEN** the tRPC response carries the `FORBIDDEN` code
- **AND** the message is `Event <eventId> is outside the requested wedding scope`

### Requirement: Server side callers receive the same failure category
Server side callers that invoke business logic directly, without tRPC, such as server actions and server components, SHALL be able to tell the failure category apart and branch on it.

#### Scenario: Save-the-date update with an expired invite
- **WHEN** a guest submits the save-the-date update form with an invite cookie that no longer authorizes the household
- **THEN** the page redirects to the update page with `error=expired`

#### Scenario: Save-the-date update with invalid details
- **WHEN** a guest submits the save-the-date update form with details that fail validation or conflict with existing data
- **THEN** the page redirects to the update page with `error=validation`
