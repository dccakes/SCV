## ADDED Requirements

### Requirement: Dashboard can generate household-specific invite links
The system SHALL allow an authenticated dashboard user to generate a signed save-the-date invite link for a household that belongs to the active wedding.

#### Scenario: Link is generated for an allowed household
- **WHEN** a dashboard user requests an invite link for a household in their active wedding
- **THEN** the system returns a public URL containing a signed household invite token for that household

#### Scenario: Link generation rejects households outside the active wedding
- **WHEN** a dashboard user requests an invite link for a household that does not belong to their active wedding
- **THEN** the system rejects the request and does not return an invite link

---

### Requirement: Invite token authenticates each browser for one year
The system SHALL validate household invite tokens and store a browser cookie that authenticates the invited household for one year.

#### Scenario: Valid invite token sets browser cookie
- **WHEN** a guest opens `/{websiteSubUrl}/invite/{token}` with a valid token for that website and household
- **THEN** the system sets an HTTP-only household invite cookie expiring in one year for that browser
- **AND** redirects the guest to `/{websiteSubUrl}/invite`

#### Scenario: Invite link can be opened in multiple browsers
- **WHEN** the same valid invite link is opened in a second browser before token expiry
- **THEN** the system sets an independent household invite cookie for that browser

#### Scenario: Tampered token is rejected
- **WHEN** a guest opens an invite URL with a token whose signed payload has been changed
- **THEN** the system rejects the token and does not set a household invite cookie

#### Scenario: Expired token is rejected
- **WHEN** a guest opens an invite URL with an expired household invite token
- **THEN** the system rejects the token and does not set a household invite cookie

---

### Requirement: Save-the-date page displays household and wedding information
The system SHALL show an authenticated invited household a guest-facing save-the-date page with the relevant wedding and household information.

#### Scenario: Authenticated household sees save-the-date details
- **WHEN** a guest with a valid household invite cookie opens `/{websiteSubUrl}/invite`
- **THEN** the page displays the couple names from the wedding record
- **AND** displays the household guest names from the household record
- **AND** displays May 30, 2027
- **AND** displays Puebla, Mexico

#### Scenario: Unauthenticated visitor cannot view household details
- **WHEN** a visitor without a valid household invite cookie opens `/{websiteSubUrl}/invite`
- **THEN** the system shows an invalid or unavailable invite state instead of household details

---

### Requirement: Household can update mailing and member contact details
The system SHALL let an authenticated invited household update its own mailing address and existing household member names and contact fields.

#### Scenario: Household updates its own details
- **WHEN** a guest with a valid household invite cookie submits updated address and member contact details for the token household
- **THEN** the system saves those changes to the matching household and guests
- **AND** returns the guest to the save-the-date page with confirmation

#### Scenario: Form is prefilled for the household
- **WHEN** a guest with a valid household invite cookie opens the update page
- **THEN** the form is populated with the current household address and existing household member details

#### Scenario: Updates cannot include guests outside the household
- **WHEN** a guest submits an update payload containing a guest ID outside the token household
- **THEN** the system rejects the update and does not modify that guest

#### Scenario: Public flow does not create or delete guests
- **WHEN** a guest submits household details through the invite form
- **THEN** the system only updates the household and existing guests represented by the authenticated household invite

---

### Requirement: Invite access is scoped to website and household
The system SHALL restrict public invite access by token signature, token purpose, token expiry, website sub URL, wedding ID, and household ID.

#### Scenario: Token for a different website is rejected
- **WHEN** a guest opens an invite token on a website sub URL that does not match the token wedding
- **THEN** the system rejects the invite and does not expose household details

#### Scenario: Token purpose must match household invite
- **WHEN** a guest opens a signed token created for a purpose other than household save-the-date invitation
- **THEN** the system rejects the token and does not expose household details

#### Scenario: Dashboard-only fields are not editable
- **WHEN** a guest submits details through the invite update form
- **THEN** RSVP statuses, invitations, tags, notes, gifts, and dashboard-only fields are not editable through that public flow

---

### Requirement: Save-the-date flow does not collect RSVPs
The system SHALL use the household invite flow only for save-the-date presentation and address collection, not RSVP collection.

#### Scenario: Invite page omits RSVP controls
- **WHEN** an invited household views the save-the-date page or update form
- **THEN** the guest-facing flow does not present RSVP accept or decline controls
