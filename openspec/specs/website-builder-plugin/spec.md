## ADDED Requirements

### Requirement: Wedding Website nav item in sidebar
The system SHALL display a "Wedding Website" item in the authenticated sidebar navigation that links to `/website`.

#### Scenario: Nav item visible to authenticated users
- **WHEN** an authenticated user views the sidebar
- **THEN** a "Wedding Website" navigation item is visible

#### Scenario: Nav item navigates to internal editor
- **WHEN** an authenticated user clicks "Wedding Website" in the sidebar
- **THEN** they are taken to `/website`

---

### Requirement: `website_builder` plugin toggle in Settings > Plugins
The system SHALL provide a "Plugins" section within the Settings page containing a toggle for "Public Wedding Website". Enabling it adds `"website_builder"` to `Wedding.enabledAddOns`; disabling removes it.

#### Scenario: User enables website builder plugin
- **WHEN** an authenticated user toggles "Public Wedding Website" to ON in Settings > Plugins
- **THEN** `"website_builder"` is added to their `Wedding.enabledAddOns`

#### Scenario: User disables website builder plugin
- **WHEN** an authenticated user toggles "Public Wedding Website" to OFF in Settings > Plugins
- **THEN** `"website_builder"` is removed from their `Wedding.enabledAddOns`

#### Scenario: Toggle reflects current enabled state
- **WHEN** an authenticated user opens Settings > Plugins
- **THEN** the "Public Wedding Website" toggle shows ON if `"website_builder"` is in `enabledAddOns`, OFF otherwise

---

### Requirement: Internal editor accessible only when plugin is enabled
The system SHALL show the website editor at `/website` only when `"website_builder"` is present in the wedding's `enabledAddOns`. When the plugin is disabled, the route SHALL display a callout prompting the user to enable it in Settings.

#### Scenario: Editor loads when plugin enabled
- **WHEN** an authenticated user navigates to `/website` and `"website_builder"` is in `enabledAddOns`
- **THEN** the website content editor is displayed

#### Scenario: Callout shown when plugin disabled
- **WHEN** an authenticated user navigates to `/website` and `"website_builder"` is NOT in `enabledAddOns`
- **THEN** the system displays a callout explaining the feature and linking to Settings > Plugins

#### Scenario: Callout link navigates to Plugins settings
- **WHEN** the user clicks the callout link in the disabled editor state
- **THEN** they are taken to the Settings page, Plugins section

---

### Requirement: Website builder auto-creates Website record on first editor visit
The system SHALL automatically create a `Website` record (and its default HOME section) the first time an authenticated user visits `/website` with the plugin enabled, if no `Website` record exists for their wedding.

#### Scenario: First visit creates Website and HOME section
- **WHEN** an authenticated user with no existing `Website` record visits `/website` with `website_builder` enabled
- **THEN** a `Website` record is created with an auto-generated `subUrl` and a HOME `WebsiteSection` is created with `isEnabled: true`

#### Scenario: Subsequent visits do not duplicate records
- **WHEN** an authenticated user with an existing `Website` record visits `/website`
- **THEN** no duplicate `Website` or `WebsiteSection` records are created

---

### Requirement: RSVP always accessible regardless of plugin state
The system SHALL serve the RSVP form at `/w/[slug]/rsvp` regardless of whether `"website_builder"` is in `enabledAddOns`, as long as `Website.isRsvpEnabled` is true.

#### Scenario: RSVP accessible with plugin disabled
- **WHEN** `"website_builder"` is NOT in `enabledAddOns` and `isRsvpEnabled` is true
- **THEN** guests can access `/w/[slug]/rsvp` and submit their RSVP

#### Scenario: RSVP disabled by `isRsvpEnabled` flag
- **WHEN** `Website.isRsvpEnabled` is false
- **THEN** the system returns a 404 for `/w/[slug]/rsvp`, regardless of plugin state

---

### Requirement: Public website shows minimal page when plugin is disabled
The system SHALL render a minimal public page at `/w/[slug]` when the website builder plugin is disabled. The minimal page SHALL display the couple's names and a link to the RSVP form (if RSVP is enabled). It SHALL NOT render any `WebsiteSection` content.

#### Scenario: Minimal page with RSVP link
- **WHEN** a guest visits `/w/johndoeandjanesmithh` and `website_builder` is NOT enabled
- **THEN** the page displays the couple's names and a link to `/w/johndoeandjanesmithh/rsvp`

#### Scenario: Minimal page without RSVP link when RSVP disabled
- **WHEN** a guest visits `/w/[slug]`, `website_builder` is NOT enabled, and `isRsvpEnabled` is false
- **THEN** the page displays only the couple's names, with no RSVP link

#### Scenario: Full content page when plugin is enabled
- **WHEN** a guest visits `/w/[slug]` and `website_builder` IS enabled
- **THEN** the page renders all enabled `WebsiteSection` content in addition to the couple's names
