## ADDED Requirements

### Requirement: Website content organised into typed sections
The system SHALL store wedding website content as a collection of `WebsiteSection` records, each identified by a `type`, with an `isEnabled` flag, an ordering `position`, and a `content` JSON field whose shape is determined by the section `type`.

#### Scenario: Multiple sections can exist for one website
- **WHEN** a website has sections of type `HOME`, `OUR_STORY`, and `TRAVEL`
- **THEN** each section is stored as a separate `WebsiteSection` row linked to the `Website` by `websiteId`

#### Scenario: Section content shape is type-specific
- **WHEN** a `HOME` section is read
- **THEN** its `content` JSON contains `{ introText: string }`

#### Scenario: Disabled section not rendered publicly
- **WHEN** a `WebsiteSection` has `isEnabled: false`
- **THEN** the public website page does not render that section's content

---

### Requirement: HOME section created by default when website is enabled
The system SHALL automatically create a `WebsiteSection` of type `HOME` with `isEnabled: true` and position `0` when a `Website` record is first created (i.e., when the couple enables the website).

#### Scenario: HOME section exists after website creation
- **WHEN** a couple enables their website for the first time
- **THEN** a `WebsiteSection` of type `HOME` exists for their website with `isEnabled: true`

#### Scenario: Default HOME section has empty introText
- **WHEN** the HOME section is created automatically
- **THEN** its `content` is `{ "introText": "" }`

---

### Requirement: Couple can edit the HOME section `introText`
The system SHALL allow an authenticated couple to update the `introText` field of their HOME section via the internal editor. The value SHALL be a plain text string with no length minimum and a maximum of 2000 characters.

#### Scenario: Saving intro text persists the value
- **WHEN** a couple enters text in the intro text field and saves
- **THEN** the `WebsiteSection.content.introText` is updated in the database

#### Scenario: Intro text exceeding 2000 characters is rejected
- **WHEN** a couple submits an `introText` value longer than 2000 characters
- **THEN** the system returns a validation error and does not save

#### Scenario: Empty intro text is valid
- **WHEN** a couple saves with an empty `introText`
- **THEN** the system accepts the value and the public page renders no intro text

---

### Requirement: HOME section `introText` rendered on the public website
The system SHALL display the `introText` value from the HOME section on the public `/w/[slug]` page when the section is enabled and the value is non-empty.

#### Scenario: Non-empty introText is rendered
- **WHEN** a guest visits `/w/[slug]` and the HOME section has a non-empty `introText`
- **THEN** the intro text is visible on the page

#### Scenario: Empty introText renders nothing
- **WHEN** the HOME section `introText` is empty or the section is disabled
- **THEN** no intro text element is rendered on the public page

---

### Requirement: `WebsiteSection` position controls render order
The system SHALL render enabled sections on the public website in ascending `position` order.

#### Scenario: Lower position renders first
- **WHEN** the website has a HOME section at position `0` and an OUR_STORY section at position `1`
- **THEN** HOME is rendered before OUR_STORY on the public page
