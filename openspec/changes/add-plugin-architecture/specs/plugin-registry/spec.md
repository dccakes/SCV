## ADDED Requirements

### Requirement: Typed Plugin manifest contract

The system SHALL define a typed `PluginManifest` contract, exported from a public `~/plugin-sdk` barrel, that every plugin provides. A manifest SHALL declare a stable kebab-case `id`, a human `name`, a `description`, a `version`, a `kind` (`'feature'` or `'theme'`), and an `enablement` policy (`defaultEnabled`, `coupleToggleable`, optional `alwaysOn`). A manifest MAY declare `dependsOn` (other plugin ids). The manifest metadata module SHALL NOT import React or server-only code, so it can be listed on both server and client.

#### Scenario: Manifest is React-free and client-listable

- **WHEN** client code imports the plugin manifest metadata
- **THEN** the import succeeds without pulling in React components or server-only modules

#### Scenario: Manifest id is the enablement key

- **WHEN** a plugin declares `id: "song-requests"` and `enablement.coupleToggleable: true`
- **THEN** the same `"song-requests"` string is the value stored in `Wedding.enabledAddOns` when a couple enables it

### Requirement: Central plugin registry

The system SHALL provide a central registry (`src/plugins/registry.ts`) that is the single explicit list of installed plugins. Registering a plugin SHALL require adding its folder and a single import entry to the registry — and SHALL NOT require editing `src/server/api/root.ts`, `src/components/nav/sidebar-nav.tsx`, or `src/lib/auth-permissions.ts` directly.

#### Scenario: Adding a plugin touches only its folder and the registry

- **WHEN** a developer adds a new feature plugin folder and one entry to `src/plugins/registry.ts`
- **THEN** the plugin's tRPC router, nav item, permissions, and settings toggle become active without any edit to `root.ts`, the sidebar array, or the permission statement map

#### Scenario: Duplicate plugin ids are rejected

- **WHEN** two registered plugins declare the same `id`
- **THEN** the registry fails fast at build/startup with an error naming the duplicate id

#### Scenario: Missing dependency is rejected

- **WHEN** a registered plugin declares `dependsOn: ["website-builder"]` and `website-builder` is not registered
- **THEN** the registry fails fast at build/startup with an error naming the missing dependency

### Requirement: Registry derives the tRPC router

The system SHALL build the tRPC `appRouter` by composing core routers with every registered plugin's contributed `router`, keyed by the plugin `id`. Plugins without a `router` contribute no procedures.

#### Scenario: Plugin router is reachable under its id

- **WHEN** a plugin with `id: "song-requests"` contributes a router exposing a `list` query
- **THEN** the procedure is callable at `songRequests.list` (or the id's canonical camelCase) through the composed `appRouter`

#### Scenario: Router composition is order-independent and side-effect-free

- **WHEN** the registry composes plugin routers
- **THEN** composition is a pure projection of the registry with no import-time side effects, and the resulting router type-checks regardless of plugin registration order

### Requirement: Registry derives permissions

The system SHALL compose the better-auth `authzStatement` and role grants from each plugin's optional `permissions` fragment, rather than from a single hardcoded map. A plugin that declares a `PermissionFragment` SHALL have its resources/actions merged into the statement and granted to the roles the fragment specifies.

#### Scenario: Plugin permission fragment is enforced

- **WHEN** a plugin declares a `song_request: ["create", "delete"]` permission fragment granted to `owner` and `admin`
- **THEN** a `member`-role user is denied `song_request.create` and an `owner`-role user is allowed it, through the same `requirePermission` path used by existing domains
