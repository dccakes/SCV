## Why

OSWP already ships the *primitives* of a plugin system but not the *system*:

- `Wedding.enabledAddOns String[]` (`prisma/schema.prisma:21`) stores per-wedding feature toggles, but only one real add-on (`website_builder`) is wired, and the validator hardcodes `addOn: z.enum(['website_builder'])` (`wedding.validator.ts:46`).
- The Settings > Plugins card (`src/app/_components/settings/plugins-settings-card.tsx`) renders a single hardcoded Switch, not a list driven by a registry.
- The sidebar (`src/components/nav/sidebar-nav.tsx:11`) is a static `SIDEBAR_SECTIONS` array gated only by role — it has no knowledge of which add-ons are enabled, so a feature cannot contribute its own nav item.
- Adding any new feature requires hand-editing four central files: `prisma/schema.prisma` (+ the `Wedding` back-relations), `src/server/api/root.ts` (router registration), and `src/lib/auth-permissions.ts` (every role). There is no "drop in a folder and it registers itself" path.
- The `src/templates/registry.ts` theme system already proves the pattern the project wants ("add a folder, register it, nothing else changes") — but it is a bespoke, theme-only registry disconnected from the add-on/toggle machinery.

The maintainers want to turn OSWP into a set of plugin-style components that couples can turn on/off, that self-hosters can choose to include, and that the community can build and open-source with minimal friction. The seams already exist; this change formalizes them into one coherent, documented plugin architecture instead of four disconnected mechanisms.

This change is **specification-only** — it defines the architecture, the plugin contract, the enablement model, and the migration path. Implementation lands as follow-up changes (see `tasks.md`, which is scoped as a phased rollout, not a single PR).

## What Changes

- **Adopt a modular-monolith plugin model with a compile-time registry** (see `design.md`, Decision 1 for why this is recommended over installable-package and fully-runtime-dynamic models given Prisma's single schema, tRPC's static router, and RSC's build step). Define a typed `Plugin` manifest contract that a plugin folder exports.
- **Introduce a central plugin registry** (`src/plugins/registry.ts`) that is the single source of truth from which the app *derives* the tRPC `appRouter`, the sidebar navigation, the authz permission statements, and the Settings > Plugins list — replacing today's four hand-edited touchpoints.
- **Generalize `enabledAddOns` into a three-tier enablement model**: build-time (self-hoster: which plugins are registered), instance-level (platform admin: which registered plugins are available/gated), and per-wedding (couple: which available plugins are on). Effective-enabled = registered AND allowed AND (couple-enabled OR always-on).
- **Make navigation registry-driven**: `SIDEBAR_SECTIONS` becomes a projection of enabled plugins' declared nav contributions, still intersected with role capabilities.
- **Make the Plugins settings card registry-driven**: it iterates couple-toggleable plugins from the registry instead of hardcoding `website_builder`.
- **Formalize theme plugins** as a first-class plugin subtype, folding the existing `src/templates/registry.ts` contract into the general manifest while preserving per-wedding `Website.templateId` selection.
- **Define a public plugin SDK surface** (`~/plugin-sdk` barrel) exposing the UI kit, design tokens, tRPC helpers, and plugin types, plus a scaffold command and a `docs/plugins/` author guide — so third parties build against a stable, versioned contract that matches `DESIGN.md` and the `oswp-ui-skill`.
- **Migrate `website_builder` to be the reference full-feature plugin** and the theme system to be the reference theme plugin, validating the contract against two existing, shipping features.

## Capabilities

### New Capabilities

- `plugin-registry`: A typed `Plugin` manifest and a central registry from which the app derives its tRPC router, navigation, authz permissions, and settings surface. Adding a plugin means adding a folder and one registry line — no edits to `root.ts`, the sidebar, or the permission map.
- `plugin-enablement`: Three-tier plugin enablement (build-time / instance / per-wedding) with a single `isPluginEnabledForWedding` resolver, generalizing `Wedding.enabledAddOns` beyond the hardcoded `website_builder`.
- `plugin-navigation`: Sidebar navigation projected from the enabled plugins' declared nav contributions, intersected with role capabilities and graceful when a plugin is disabled.
- `theme-plugins`: A formalized theme-plugin contract (components + theme tokens + metadata) unifying the existing `src/templates` registry with the plugin manifest, selectable per wedding.

### Modified Capabilities

- `website-builder-plugin`: Re-expressed as an instance of the general plugin registry (its toggle, nav item, and gating now flow through the registry/enablement resolver rather than bespoke code). No user-facing behavior change.

## Impact

- **Schema**: no new couple-facing tables required for the core (reuses `Wedding.enabledAddOns`). Optional `PluginPolicy` concern for platform-admin gating may be env-backed in V1 (see `design.md`, Decision 4) — no forced migration. Plugin-owned models still live in the central `schema.prisma` in V1 (the Prisma single-schema constraint; Decision 5 documents the future split path).
- **API**: `src/server/api/root.ts` becomes a thin `createTRPCRouter(buildPluginRouters(registry))`; individual domain routers are contributed by plugin manifests. `wedding.toggleAddOn` validator changes from `z.enum(['website_builder'])` to "any couple-toggleable plugin id in the registry."
- **Auth**: `src/lib/auth-permissions.ts` `authzStatement` and role grants are composed from plugin-declared permission fragments instead of one hardcoded map.
- **UI**: `src/components/nav/sidebar-nav.tsx` and `src/app/_components/settings/plugins-settings-card.tsx` become registry-driven; new `~/plugin-sdk` barrel; new `docs/plugins/authoring.md`.
- **No breaking changes for couples**: existing `enabledAddOns` values keep working; `website_builder` and the theme system are migrated behind the same behavior. Graceful-degradation contract from `website-builder-plugin/spec.md` is generalized to all plugins.
- **Follow-up changes**: implementation is phased (registry contract → router derivation → nav/settings derivation → permissions derivation → theme fold-in → SDK + docs + scaffold). Each phase is independently shippable behind the unchanged public behavior.
