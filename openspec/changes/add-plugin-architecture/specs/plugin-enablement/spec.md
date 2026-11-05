## ADDED Requirements

### Requirement: Three-tier enablement resolution

The system SHALL determine whether a plugin is active for a given wedding by requiring agreement across three tiers: build-time registration (self-hoster), instance policy (platform admin), and per-wedding preference (couple). A plugin SHALL be active for a wedding if and only if it is registered AND permitted by instance policy AND (it is `alwaysOn`, OR it is not `coupleToggleable`, OR its `id` is present in `Wedding.enabledAddOns`). This SHALL be exposed as a single resolver `isPluginEnabledForWedding`.

#### Scenario: All three tiers agree — plugin active

- **WHEN** a plugin is registered, permitted by instance policy, `coupleToggleable`, and its id is in `Wedding.enabledAddOns`
- **THEN** `isPluginEnabledForWedding` returns true and the plugin's routes, nav, and router guards treat it as active

#### Scenario: Not registered — plugin inert

- **WHEN** a plugin id is not present in `registry.ts` (or is suppressed via the `OSWP_DISABLED_PLUGINS` allowlist)
- **THEN** `isPluginEnabledForWedding` returns false regardless of instance policy or `enabledAddOns`, and no nav item, route, or procedure for it is exposed

#### Scenario: Registered but gated by instance policy

- **WHEN** a plugin is registered and in a wedding's `enabledAddOns`, but instance policy does not permit it (e.g. a beta/paid plugin on a plan that excludes it)
- **THEN** `isPluginEnabledForWedding` returns false and the couple cannot activate it, even though the id is stored

#### Scenario: alwaysOn plugin ignores the couple tier

- **WHEN** a registered, policy-permitted plugin declares `enablement.alwaysOn: true`
- **THEN** it is active for every wedding regardless of `enabledAddOns`, and it does not appear as a couple-facing toggle

### Requirement: Per-wedding toggle generalized beyond website_builder

The system SHALL allow a couple to toggle any `coupleToggleable` registered plugin via `wedding.toggleAddOn`, storing/removing the plugin `id` in `Wedding.enabledAddOns`. The toggle validator SHALL accept any couple-toggleable plugin id known to the registry, replacing the hardcoded `z.enum(['website_builder'])`.

#### Scenario: Enabling an arbitrary couple-toggleable plugin

- **WHEN** a couple toggles a registered `coupleToggleable` plugin with id `"song-requests"` ON
- **THEN** `"song-requests"` is added to `Wedding.enabledAddOns` and the mutation is permission-checked exactly as the existing `toggleAddOn` (`requirePermission(ctx, { wedding: ['update'] })`)

#### Scenario: Toggling an unknown or non-toggleable plugin is rejected

- **WHEN** a `toggleAddOn` call names a plugin id that is not registered, or is registered but `coupleToggleable: false`
- **THEN** the validator rejects the input at the API boundary

#### Scenario: Existing enabledAddOns values keep working

- **WHEN** a wedding already has `enabledAddOns: ["website_builder", "tasks"]` before this change ships
- **THEN** those plugins resolve as active under the new resolver with no data migration required

### Requirement: Instance policy is configurable without a schema change

The system SHALL let a platform admin gate which registered plugins are available on a deployment through configuration (e.g. an `OSWP_PLUGIN_POLICY` env-backed policy port) without requiring a database migration. The enablement resolver SHALL consult this policy as its instance tier.

#### Scenario: Platform admin disables a registered plugin fleet-wide

- **WHEN** a platform admin configures instance policy to exclude plugin `"song-requests"`
- **THEN** `isPluginEnabledForWedding` returns false for every wedding, and the plugin is neither couple-toggleable nor navigable, without any code edit or migration

#### Scenario: Default policy permits all registered plugins

- **WHEN** no instance policy is configured
- **THEN** every registered plugin is treated as permitted at the instance tier, preserving current single-tenant/self-host behavior
