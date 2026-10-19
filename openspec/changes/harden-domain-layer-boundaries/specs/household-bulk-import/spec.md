# Spec Delta

## Purpose

Defines how importing many households at once is scoped to the active wedding and how failures in a batch are reported, independent of which entry point starts the import.

## ADDED Requirements

### Requirement: Out-of-scope events reject the whole import before anything is saved
A bulk household import SHALL check every event referenced by any guest's invites before creating anything. If any event does not belong to the target wedding, the import SHALL fail with a `FORBIDDEN` error and create no households.

#### Scenario: Last household references a foreign event
- **WHEN** a coordinator imports three households and only the third references an event from another wedding
- **THEN** the system rejects the import with a `FORBIDDEN` error naming that event
- **AND** none of the three households are created

#### Scenario: Check applies regardless of entry point
- **WHEN** the bulk import operation is called by a server side caller other than the tRPC household router, with a batch referencing a foreign event
- **THEN** the system rejects the import with a `FORBIDDEN` error
- **AND** no households are created

### Requirement: Per-household failures are counted, authorization failures abort
When every referenced event is in scope, a bulk import SHALL create each household independently and report how many were created and how many failed. An authorization failure SHALL stop the import and be returned as an error.

#### Scenario: One household fails for a non-authorization reason
- **WHEN** a coordinator imports three in-scope households and the second fails to save
- **THEN** the system returns `created: 2` and `failed: 1`

#### Scenario: Caller lacks import permission
- **WHEN** a user without guest import permission starts a bulk import
- **THEN** the system rejects it with a `FORBIDDEN` error and creates no households
