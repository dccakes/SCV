## ADDED Requirements

### Requirement: Theme plugins conform to the plugin manifest

The system SHALL express public-website themes as plugins of `kind: 'theme'` whose manifest wraps the existing `WeddingTemplate` contract (`TemplateComponents` + `TemplateTheme`). The existing `src/templates` registry SHALL become the theme-subtype projection of the central plugin registry, preserving the `catalog.ts` (React-free metadata) / `registry.ts` (runtime components) split. Adding a theme SHALL continue to require only building it under `src/templates/<id>/`, adding its manifest/catalog entry, and registering it — with nothing else in the app changing.

#### Scenario: Existing themes still resolve

- **WHEN** the theme registry is folded under the plugin manifest
- **THEN** the `classic`, `aurelia`, and `voyage` themes remain listable and `resolveTemplate(id)` still returns them with the default-fallback behavior unchanged

#### Scenario: Adding a theme is folder + registry only

- **WHEN** a contributor adds a new theme under `src/templates/<id>/` with a manifest and registers it
- **THEN** the theme becomes selectable without edits to routing, nav, or the public page renderer

### Requirement: Theme selection is per-wedding and choose-one

The system SHALL keep theme selection on the `Website.templateId` field (choose exactly one active theme per wedding), distinct from the many-on `enabledAddOns` toggling used for feature plugins. Theme plugins SHALL be gated by build-time registration and instance policy, but SHALL NOT appear as couple on/off toggles in Settings > Plugins.

#### Scenario: Selecting a theme sets templateId

- **WHEN** a couple selects a registered, policy-permitted theme
- **THEN** `Website.templateId` is set to that theme's id and the public site renders with that theme

#### Scenario: Theme is not a Settings > Plugins toggle

- **WHEN** a couple opens Settings > Plugins
- **THEN** themes are not listed as on/off switches there (they are selected in the website/theme picker, not toggled as add-ons)

#### Scenario: Instance policy can restrict available themes

- **WHEN** instance policy excludes a registered theme
- **THEN** that theme does not appear in the couple's theme picker, without a code edit or migration

### Requirement: A base template provides default surfaces (token-only authoring)

The system SHALL provide a base template that implements every guest-facing surface (`Home`, `HomeMobile`, `Minimal`, `SaveTheDate`, `Invitation`, `Sections`) from `WeddingPageData` using only semantic design tokens. A new theme SHALL be able to ship by providing ONLY its catalog metadata and its `theme` (fonts + `cssVars`), inheriting all surface components from the base. Authoring a look-only theme SHALL NOT require writing any surface component.

#### Scenario: Token-only theme renders every surface

- **WHEN** a contributor registers a theme that supplies metadata and a `theme` (cssVars + fontClassName) but no `components`
- **THEN** the public site, minimal page, save-the-date, invitation, and content sections all render using the base template surfaces restyled by the theme's tokens

#### Scenario: Token-only theme is the scaffold default

- **WHEN** a contributor scaffolds a new theme
- **THEN** the generated theme compiles and renders end-to-end as a token-only theme before any custom component is written

### Requirement: Themes may override individual surfaces with base fallback

The system SHALL allow a theme to provide a partial set of surface components; `resolveTemplate` SHALL merge the theme's provided components over the base template's defaults, so an author overrides only the surfaces they want to restyle and inherits the rest. This SHALL preserve the existing default-template fallback for unknown/missing `templateId`.

#### Scenario: Overriding only the Home surface

- **WHEN** a theme provides a custom `Home` component and no others
- **THEN** the site renders the theme's `Home` and inherits `HomeMobile`, `Minimal`, `SaveTheDate`, `Invitation`, and `Sections` from the base

#### Scenario: Missing templateId still falls back to the default theme

- **WHEN** a website has a null or unknown `templateId`
- **THEN** `resolveTemplate` returns the default theme exactly as today

### Requirement: Themes inherit section rendering from the shared registry

The system SHALL let a theme render website content sections through the shared keyed section registry (per the plugin-ui-slots capability) rather than re-implementing a `switch(section.type)`. A theme MAY override the renderer for specific section types to restyle them, and SHALL inherit the default renderer for the rest. Adding a new section type SHALL NOT require any edit to existing themes.

#### Scenario: New section type appears in a theme without editing it

- **WHEN** a new website section type is added with a default renderer and a theme provides no override for it
- **THEN** that theme renders the new section via the default renderer with no edit to the theme

#### Scenario: Theme restyles one section type

- **WHEN** a theme registers an override renderer for the `TIMELINE` section type
- **THEN** that theme renders `TIMELINE` with its override while inheriting default renderers for all other section types

### Requirement: Theme scaffold and local preview

The system SHALL provide a scaffold (e.g. `npm run template:new <id>`) that generates a compiling, registered token-only theme, and a preview path that renders any theme against representative seed wedding data so an author can see all surfaces without creating a real wedding. The theme author flow SHALL be documented in `docs/plugins/`.

#### Scenario: Scaffolding a theme yields a working, listed theme

- **WHEN** a contributor runs the theme scaffold with a new id
- **THEN** a token-only theme folder and catalog/registry entries are generated, the theme compiles, and it appears in the theme picker

#### Scenario: Previewing a theme against seed data

- **WHEN** an author opens the theme preview for their theme id
- **THEN** the base (and any overridden) surfaces render with representative seed wedding data, without requiring a live wedding record

### Requirement: Theme acceptance follows the design contract

The system SHALL hold theme plugins to the same acceptance contract as other plugins: semantic tokens only (no hardcoded colors outside the theme's own `cssVars`), light and dark handling as applicable, mobile 375px validation, and required catalog metadata (`name`, `description`, `swatches`). This SHALL answer the community-contributed-template review question flagged in `DESIGN.md`.

#### Scenario: A theme missing required metadata is rejected

- **WHEN** a theme is registered without a `name`, `description`, or `swatches`
- **THEN** the registry fails fast at build/startup naming the missing metadata

#### Scenario: A theme with hardcoded product colors fails review

- **WHEN** a submitted theme hardcodes colors in a surface component instead of expressing them through its `theme.cssVars`
- **THEN** it does not meet the acceptance contract's semantic-token requirement
