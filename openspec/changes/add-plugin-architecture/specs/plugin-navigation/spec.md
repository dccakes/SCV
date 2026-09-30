## ADDED Requirements

### Requirement: Sidebar navigation is derived from enabled plugins

The system SHALL build the authenticated sidebar navigation by projecting the nav contributions declared by plugins that are active for the current wedding (per the three-tier resolver), instead of from a static hardcoded array. Each plugin MAY declare one or more `NavContribution`s (label, href, icon, and section grouping). Core (non-plugin) nav items MAY remain declared centrally.

#### Scenario: Enabled plugin contributes its nav item

- **WHEN** a feature plugin is active for the wedding and declares a nav contribution (label, href, icon)
- **THEN** that item appears in the sidebar under its declared section

#### Scenario: Disabled plugin contributes no nav item

- **WHEN** a plugin is not active for the wedding (any tier fails)
- **THEN** its nav item does not appear in the sidebar

#### Scenario: Nav still respects role capabilities

- **WHEN** the current user lacks `capabilities.canViewPlanning`
- **THEN** planning-section plugin nav items are hidden even if the plugins are active, preserving the existing role gate (only Settings remains)

### Requirement: Plugin route access matches nav enablement

The system SHALL gate a feature plugin's route segment on the same enablement resolution used for its nav item. When a plugin is not active for the wedding, its route SHALL degrade gracefully rather than expose functionality — following the established `website_builder` pattern of a callout linking to Settings > Plugins.

#### Scenario: Disabled plugin route shows enable-callout

- **WHEN** an authenticated user navigates directly to a `coupleToggleable` plugin's route while the plugin is not in `enabledAddOns`
- **THEN** the route displays a callout explaining the feature and linking to Settings > Plugins, rather than the feature UI

#### Scenario: Instance-gated plugin route is not reachable

- **WHEN** an authenticated user navigates to a plugin's route while instance policy excludes the plugin
- **THEN** the feature UI is not rendered and the couple has no path to enable it
