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
