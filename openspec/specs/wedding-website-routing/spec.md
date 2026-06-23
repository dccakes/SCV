## ADDED Requirements

### Requirement: Public wedding website served at `/w/[slug]`
The system SHALL serve public wedding website pages at the path `/w/[websiteSubUrl]` rather than `/{websiteSubUrl}`. The `websiteSubUrl` value is the unique slug stored on the `Website` record.

#### Scenario: Guest navigates to public website URL
- **WHEN** an unauthenticated user navigates to `/w/johndoeandjanesmithh`
- **THEN** the system returns the public wedding website page for the couple with that slug

#### Scenario: Slug not found returns 404
- **WHEN** an unauthenticated user navigates to `/w/unknownslug`
- **THEN** the system returns a 404 not found response

#### Scenario: RSVP sub-route remains accessible
- **WHEN** a guest navigates to `/w/johndoeandjanesmithh/rsvp`
- **THEN** the system returns the RSVP form page for that wedding

---

### Requirement: Legacy `/{slug}` URLs redirect to `/w/[slug]`
The system SHALL permanently redirect requests matching a valid website slug at the root path `/{slug}` to `/w/{slug}` to preserve links shared before the URL restructure.

#### Scenario: Old root-level URL redirects to new path
- **WHEN** a user navigates to `/johndoeandjanesmithh`
- **THEN** the system responds with a redirect to `/w/johndoeandjanesmithh`

#### Scenario: Reserved root segments are not redirected
- **WHEN** a user navigates to `/dashboard` or `/settings`
- **THEN** the system does NOT redirect; it routes normally to the authenticated app

---

### Requirement: `/website` is a reserved authenticated route
The system SHALL treat `website` as a reserved root segment so that no couple can create a wedding website with the slug `website`, preventing routing conflicts with the internal editor.

#### Scenario: `website` blocked as a slug
- **WHEN** a couple attempts to set their website `subUrl` to `"website"`
- **THEN** the system returns a validation error and does not save the slug

#### Scenario: Other reserved segments remain blocked
- **WHEN** a couple attempts to use any value in `RESERVED_ROOT_SEGMENTS` as their slug
- **THEN** the system returns a validation error

---

### Requirement: Full website URL computed from `subUrl` at runtime
The system SHALL derive the full public URL of a wedding website by combining the application base URL with the `/w/` prefix and the `subUrl`. The `url` field SHALL NOT be stored on the `Website` database record.

#### Scenario: URL computation for display
- **WHEN** the system needs to display or return the full website URL
- **THEN** it computes `${APP_URL}/w/${website.subUrl}` dynamically

#### Scenario: `url` field no longer present
- **WHEN** a `Website` record is created or updated
- **THEN** no `url` column is written to the database
