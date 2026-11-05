## ADDED Requirements

### Requirement: Named UI slot registry

The system SHALL define a set of named UI extension regions ("slots") and a registry through which plugins contribute components to them. A slot contribution SHALL declare its `slot` name, an `order` for deterministic placement, an optional `gate` (defaulting to the owning plugin's enablement), and a `Component`. The host SHALL provide a `<Slot name="...">` primitive that renders all contributions to that slot which are active for the current wedding, ordered by `order`. Adding a slot contribution SHALL NOT require editing the host surface's file.

The initial slots SHALL include at least: `dashboard.widgets`, `settings.cards`, and `sidebar.nav` (nav items are a slot specialization consistent with the plugin-navigation capability). Slot names SHALL be an open, documented set that further slots (e.g. `guest-list.toolbar`, `event.detail`) can extend without a contract change.

#### Scenario: Plugin contributes a dashboard widget without editing the dashboard

- **WHEN** an active plugin registers a `dashboard.widgets` contribution with `order: 20` and a `Component`
- **THEN** the widget renders on the dashboard in its ordered position, and no edit to `planning-overview.tsx` (or the dashboard page) was required

#### Scenario: Slot renders only contributions active for the wedding

- **WHEN** two plugins contribute to `settings.cards` and only one is active for the wedding (per the three-tier resolver)
- **THEN** `<Slot name="settings.cards">` renders only the active plugin's card

#### Scenario: Ordering is deterministic

- **WHEN** multiple contributions target the same slot with distinct `order` values
- **THEN** they render in ascending `order`, independent of plugin registration order

### Requirement: Slot contributions respect the RSC boundary

The system SHALL resolve slot components through the registry as module references (imported at build time), NOT by passing component functions across the server/client boundary as props. The slot registry SHALL preserve the React-free-metadata / runtime-components split already used by the theme registry, so slot listing and gating can occur on the server while the components render on the correct side of the RSC boundary.

#### Scenario: Server-side gating with client-rendered widget

- **WHEN** the server determines which `dashboard.widgets` contributions are active for a wedding
- **THEN** it does so from React-free metadata, and the active client components render without a component function being serialized across the server/client boundary

### Requirement: Public-site section rendering is registry-driven

The system SHALL replace each template's hardcoded `switch(section.type)` renderer with a keyed lookup so that adding a new website section type does not require editing every template. A section type SHALL provide a default renderer usable by any template; a template MAY provide an override renderer for a section type to restyle it, and MAY fall back to the default when it provides none.

#### Scenario: New section type renders via default without touching templates

- **WHEN** a section plugin registers a new section type with a default renderer
- **THEN** every template renders that section using the default renderer, with no edit to `classic`, `aurelia`, or `voyage`

#### Scenario: Template overrides a section renderer

- **WHEN** a template provides an override renderer for a section type
- **THEN** that template renders the section with its override while other templates use the default

#### Scenario: Section enablement and ordering are unchanged

- **WHEN** sections are rendered for a public page
- **THEN** only `isEnabled` sections render, ordered by `position`, exactly as today (the catalog remains the source of order/defaults)

### Requirement: A content plugin provides both a display and an editor component

The system SHALL allow a plugin that owns editable content to register a Display component and an Editor component together, alongside a shared Zod content schema and the plugin's own persistence mutation. The host SHALL render the plugin's Editor in the appropriate management surface (e.g. the website manager for public sections, a settings card, or the plugin's own route) without a hardcoded per-type `switch`.

#### Scenario: Section editor is selected from the registry, not a switch

- **WHEN** a section plugin registers an Editor for its section type
- **THEN** the sections editor renders that Editor from the registry (replacing the `SectionFields` switch) and persists via the plugin's validated mutation

#### Scenario: Editor content is validated by the shared schema

- **WHEN** a couple edits plugin content and submits invalid data
- **THEN** the shared Zod schema rejects it on both the client form and the server mutation boundary, consistent with the existing section validator pattern

### Requirement: Slot components consume the design-system contract

The system SHALL require slot-contributed components to build on the public plugin SDK surface (the shared UI kit and semantic design tokens), so third-party UI renders consistently in light and dark themes. This SHALL be part of the plugin acceptance contract (Definition of Done (Design)).

#### Scenario: Third-party widget matches the design system

- **WHEN** a third-party plugin's widget renders in a slot
- **THEN** it uses semantic tokens (no hardcoded colors) and the shared UI primitives, and it renders correctly under both light and dark themes and at 375px width
