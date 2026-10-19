# Spec Delta

## Purpose

Defines the closed set of RSVP status values a guest invitation can hold, and guarantees that every path that writes an RSVP status accepts only those values.

## ADDED Requirements

### Requirement: RSVP status is one of four values
The system SHALL treat RSVP status as exactly one of `Not Invited`, `Invited`, `Attending` or `Declined`, matched case-sensitively. Server validation and client UI SHALL use the same list.

#### Scenario: Known value is accepted
- **WHEN** a write request sets an invitation's RSVP status to `Attending`
- **THEN** the system stores `Attending` for that invitation

#### Scenario: Value with different casing is rejected
- **WHEN** a write request sets an invitation's RSVP status to `attending`
- **THEN** the system rejects the request with a `BAD_REQUEST` error
- **AND** the stored RSVP status is unchanged

### Requirement: Public RSVP submission rejects unknown status values
The public RSVP submission endpoint SHALL reject a submission in which any response carries an RSVP status outside the allowed values, and SHALL apply none of that submission's changes.

#### Scenario: One invalid response rejects the whole submission
- **WHEN** a guest submits two RSVP responses, one `Attending` and one `Maybe`
- **THEN** the system rejects the submission with a `BAD_REQUEST` error
- **AND** neither invitation's RSVP status changes
- **AND** no question answers from that submission are stored

### Requirement: Coordinator write paths reject unknown status values
Creating or updating an invitation, and creating, updating or bulk importing households with per-event invites, SHALL reject any RSVP status outside the allowed values.

#### Scenario: Household create with invalid invite status
- **WHEN** a coordinator creates a household whose guest invites map an event to `Pending`
- **THEN** the system rejects the request with a `BAD_REQUEST` error
- **AND** no household, guest or invitation is created

#### Scenario: Bulk import with invalid invite status
- **WHEN** a coordinator bulk imports households and one guest's invites map an event to `Yes`
- **THEN** the system rejects the import with a `BAD_REQUEST` error
- **AND** no households from that import are created

### Requirement: Existing stored values remain readable
Reading invitations SHALL NOT fail because of an RSVP status already stored before this rule existed. Only writes are validated.

#### Scenario: Legacy value is returned on read
- **WHEN** an invitation row holds an RSVP status outside the allowed values and a coordinator loads the guest list
- **THEN** the guest list loads successfully and includes that invitation
