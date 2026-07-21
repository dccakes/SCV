## Context

OSWP is a Next.js 16 App Router app (React 19 RSC) with tRPC v11, Prisma 7 over a single Postgres schema, and better-auth with the organization plugin. The server is already domain-driven: 20 self-contained slices under `src/server/domains/<name>/` (each a 6-file `router/service/repository/validator/types/index` bundle), plus cross-domain use-cases under `src/server/application/`. Tenancy is `User → Member → Organization → Wedding` (org↔wedding is 1:1), and every protected query is scoped by `requireActiveWeddingId`.

Four extensibility mechanisms already exist but are disconnected:

1. **`Wedding.enabledAddOns String[]`** (`prisma/schema.prisma:21`) — per-wedding feature flags. Only `website_builder` is a real add-on; `tasks` is seeded but not user-toggleable. Validator hardcodes the enum (`wedding.validator.ts:46`).
2. **Template registry** (`src/templates/registry.ts`) — a genuine, self-described "plugin registry" for public-site themes (`classic`, `aurelia`, `voyage`), with a clean metadata/runtime split (`catalog.ts` vs `registry.ts`) and a `WeddingTemplate` contract (`src/templates/types.ts`).
3. **Website section catalog** (`website-section.catalog.ts`) — a registry of public-site block types with `defaultEnabled`.
4. **Design contract** — `DESIGN.md` (OKLCH semantic tokens, "Definition of Done (Design)"), the shadcn kit in `src/components/ui/`, and the `.agents/skills/oswp-ui-skill/` skill.

The gap is that nav, the tRPC router, the permission map, and the settings toggle are each hardcoded and edited by hand per feature. This change unifies mechanisms 1–2 (and, later, 3) under one manifest-driven registry, and defines the author-facing contract and enablement model.

Scope per maintainer direction: prioritize **full-feature plugins** (own route + DB + nav + permissions + per-wedding toggle) and **theme plugins**. Public-site block plugins and integration plugins are acknowledged as future subtypes but are non-goals here. Enablement must support **all three tiers**: couple, self-hoster, platform admin.

## Goals / Non-Goals

**Goals:**
- Recommend a plugin distribution/loading model appropriate to the stack, with an explicit migration path between tiers (the maintainer asked for a recommendation).
- Define a single typed `Plugin` manifest contract and a central registry that *derives* router, nav, permissions, and settings.
- Define the three-tier enablement model and a single resolver.
- Fold the existing `website_builder` feature and the theme system into the contract as reference implementations, proving it against shipping code with zero user-facing change.
- Define the public author surface: an SDK barrel, a scaffold, a `docs/plugins/` guide, and the design/acceptance contract for open-source contributions.

**Non-Goals (this change):**
- Fully runtime-dynamic third-party plugins (no rebuild) — explicitly rejected below; documented as a non-goal, not a deferred goal.
- Splitting `prisma/schema.prisma` into per-plugin schema files — deferred (Decision 5); plugin models stay central in V1.
- Public-site block plugins and integration plugins as concrete subtypes — the manifest is designed to admit them later, but they are not specced here.
- A plugin marketplace / installer UI, plugin sandboxing, or per-plugin billing implementation (platform-admin gating is specced; billing is out).
- Implementation itself — this is a spec-only change; `tasks.md` is the phased plan for follow-up changes.

## Decisions

### Decision 1: Plugin model — modular monolith with a compile-time registry (recommended), with a staged path to installable packages

**Choice:** Adopt a **modular monolith**. Plugins are self-registering folders/workspaces compiled into the app and toggled per-wedding. Do **not** attempt fully runtime-dynamic plugins.

**Why this over the alternatives** (the maintainer asked us to recommend):

| Model | Fit with stack | Verdict |
|---|---|---|
| **A. Compile-time modules in-repo** (chosen, Tier 1) | Prisma migrations run at deploy; tRPC types generate at build; RSC bundles at build; better-auth statements resolve at startup. All four align naturally with a build step. Community contributes via PRs, mirroring the existing `src/templates` model. | **Recommended now.** Lowest friction, fully type-safe, matches how `website_builder` and themes already work. |
| **B. Installable npm packages** (Tier 2, future) | A plugin ships as `@oswp-plugin/song-requests`; a self-hoster adds it to `package.json`, runs its migrations, and rebuilds. Needs a *stable public SDK* and a *plugin migration story* — both defined here as prerequisites. | **Path, not now.** The manifest contract designed here is deliberately package-boundary-clean so a plugin folder can later become a package with no contract change. |
| **C. Fully runtime-dynamic** (Tier 3) | Would require loading third-party code with new DB tables and new tRPC procedures *without a rebuild*. Prisma's single generated client, tRPC's compile-time-typed router, and RSC's bundler make this impossible without a plugin runtime/sandbox and a dynamic-migration engine — a project of its own, with real security and type-safety costs. | **Rejected.** Documented as a non-goal. WordPress-style hot-install is not compatible with a typed Prisma/tRPC/RSC stack without abandoning the type guarantees that are OSWP's strength. |

**Migration path A → B:** because the `Plugin` manifest is a plain object with no imports from app internals except the SDK barrel, a plugin under `src/plugins/<id>/` can be lifted into `packages/oswp-plugin-<id>/` (or an external repo) unchanged. Tier 2 then only adds: (a) a published `@oswp/plugin-sdk`, (b) a `prisma` schema-merge step (Prisma's `prismaSchemaFolder` preview feature, see Decision 5), and (c) a registry that reads installed packages from `package.json` instead of static imports. No plugin author rewrites are required.

### Decision 2: The `Plugin` manifest contract

**Choice:** Every plugin is a folder exporting one typed object. The manifest is *declarative data + typed references*, never imperative registration calls, so the registry can introspect it on both server and client (the metadata half must be React-free, mirroring the `catalog.ts`/`registry.ts` split that already works for themes).

```ts
// ~/plugin-sdk — the public contract
export type PluginId = string // kebab-case, stable, used as the enabledAddOns key

export interface PluginManifest {
  id: PluginId
  name: string
  description: string
  version: string
  kind: 'feature' | 'theme'          // extensible: 'section' | 'integration' later
  /** Enablement policy (see Decision 3). */
  enablement: {
    defaultEnabled: boolean          // per-wedding default when available
    coupleToggleable: boolean        // shows in Settings > Plugins
    alwaysOn?: boolean               // core plugins that cannot be turned off
  }
  /** Other plugin ids this plugin needs enabled. */
  dependsOn?: PluginId[]
}

// Server half (may import React/server code):
export interface FeaturePlugin {
  manifest: PluginManifest
  router?: (t: TRPCBuilders) => AnyRouter        // merged into appRouter under manifest.id
  nav?: NavContribution[]                         // projected into the sidebar
  permissions?: PermissionFragment                // merged into authz statement + roles
  settingsCard?: React.ComponentType             // optional richer settings UI
  routeSegment?: string                           // owns /app/(authenticated)/<segment>
}

export interface ThemePlugin {
  manifest: PluginManifest & { kind: 'theme' }
  theme: WeddingTemplate                          // existing src/templates contract
}
```

- `manifest` (metadata) lives in a React-free module so `catalog`-style listing works client-side.
- `router`, `nav`, `permissions` are *contributions the registry composes*, not global side effects — keeping composition order deterministic and testable, and avoiding the circular-import/TDZ hazard the current `root.ts` header already warns about.
- **Next.js file-based routing constraint:** the App Router is filesystem-driven, so a plugin cannot fully "inject" a route at runtime. The convention is: a feature plugin owns `src/app/(authenticated)/<routeSegment>/` and declares that segment in its manifest so nav/enablement can gate it. The registry validates that a declared `routeSegment` exists at build time.

### Decision 3: The central registry derives router, nav, permissions, and settings

**Choice:** `src/plugins/registry.ts` imports every plugin and exposes typed projections. The four hardcoded touchpoints become derivations:

- `buildAppRouter(registry)` → replaces the hand-maintained `createTRPCRouter({...})` in `src/server/api/root.ts`. Core (non-plugin) routers stay; plugin routers are folded in under `manifest.id`.
- `buildSidebarSections(registry, { role, enabledPluginIds })` → replaces the static `SIDEBAR_SECTIONS`; still intersected with `capabilities.canViewPlanning`.
- `buildAuthzStatement(registry)` and `buildRoleGrants(registry)` → compose `authzStatement`/roles in `auth-permissions.ts` from `PermissionFragment`s.
- `listCoupleToggleablePlugins(registry)` → drives the Settings > Plugins card.

**Rationale:** one registry, four pure projections. Adding a plugin touches its own folder + one registry import line — the "nothing else in the app needs to change" property the theme registry already advertises, now extended to the whole feature surface. Projections are pure functions → unit-testable in isolation (per `claude.md` TDD).

**Alternatives considered:**
- *Side-effecting `registerPlugin()` calls at import time* — rejected: nondeterministic order, hard to test, reintroduces the TDZ/circular-import problems `root.ts` already documents.
- *Convention-only auto-discovery by filesystem glob* — rejected for V1: implicit, and Next.js bundling + tRPC typing want explicit imports. The registry file stays the one explicit list.

### Decision 4: Three-tier enablement with one resolver

**Choice:** A plugin is *active for a wedding* iff all three tiers agree:

1. **Build-time (self-hoster)** — is the plugin in `registry.ts` at all? Absent = does not exist. A self-hoster forks/removes plugins here, or an `OSWP_DISABLED_PLUGINS` env allowlist suppresses registered ones without a code edit.
2. **Instance-level (platform admin)** — is the plugin *available* on this deployment? Backed in V1 by env (`OSWP_PLUGIN_POLICY` / per-plugin allow) so hosted operators can gate beta/paid plugins across all weddings without a schema change. Designed to graduate to a `PluginPolicy` table when a hosted control panel exists.
3. **Per-wedding (couple)** — for `coupleToggleable` plugins, is `manifest.id ∈ Wedding.enabledAddOns`? `alwaysOn` plugins skip this tier; non-toggleable-but-available plugins are on by default.

```ts
isPluginEnabledForWedding(pluginId, { registry, policy, wedding }): boolean
// registered(pluginId) && policy.allows(pluginId) && (alwaysOn || !coupleToggleable || wedding.enabledAddOns.includes(pluginId))
```

**Rationale:** the maintainer wants all three audiences to control on/off, but they control *different axes* — presence (build), availability (instance), preference (couple). Collapsing them into `enabledAddOns` alone (today's state) can't express "installed but gated to paid tier." One resolver keeps every gate check consistent across nav, routes, router guards, and public pages.

**Alternatives considered:**
- *Only per-wedding `enabledAddOns`* — today's model; can't express self-hoster or platform-admin intent.
- *A DB table per tier now* — over-built for V1; env-backed policy defers the table until a hosted panel needs it, with no contract change (the resolver takes a `policy` port).

### Decision 5: Plugin-owned Prisma models stay in the central schema in V1

**Choice:** A feature plugin documents its models in the central `prisma/schema.prisma` (and adds its `Wedding` back-relations there), exactly as domains do today. The manifest may *declare* which models it owns (for docs/validation), but does not carry schema.

**Rationale:** Prisma 7 generates one client from one schema; per-plugin `.prisma` files require the `prismaSchemaFolder` layout and a merge step, and cross-model relations (every model → `Wedding`) still cross plugin boundaries. Forcing modular schema now buys little and costs a migration-tooling rewrite. This is the main compromise of the modular-monolith model, and it is honest: **plugins are not yet zero-touch on the schema.**

**Migration path:** adopt Prisma's `prismaSchemaFolder` so each plugin contributes `prisma/plugins/<id>.prisma`; the `Wedding` relation stays central or moves to a documented "extension points" block. This is the Tier-2 prerequisite noted in Decision 1 and is tracked as a non-goal here.

**Alternatives considered:**
- *Per-plugin schema files now* — rejected for V1 scope; revisit with Tier 2.
- *Give each plugin its own database/connection* — rejected: breaks `weddingId` cascade integrity and cross-domain application services (e.g. RSVP composes five repositories).

### Decision 6: Theme plugins fold into the manifest without disturbing the working registry

**Choice:** A theme is a `ThemePlugin` (`kind: 'theme'`) wrapping the existing `WeddingTemplate` contract. The current `src/templates/registry.ts` becomes the theme-subtype projection of the general registry; `catalog.ts` metadata maps onto `PluginManifest`. Per-wedding selection stays on `Website.templateId`; themes are *available*-gated (not `enabledAddOns` toggled) since a wedding always has exactly one active theme.

**Rationale:** the theme registry is the project's proven plugin pattern and must not regress. Wrapping (not rewriting) it validates the manifest against real code and gives theme authors the same SDK + acceptance contract as feature authors. Themes differ from features on the enablement axis (choose-one vs many-on), which the `kind` discriminator and the resolver's `coupleToggleable:false` path already express.

### Decision 7: Public author surface — SDK barrel, scaffold, docs, design contract

**Choice:** Ship the author contract as:
- `~/plugin-sdk` — a stable barrel re-exporting the UI kit (`src/components/ui/*`), design-token helpers, tRPC builders/types, the `Plugin*` types, and enablement helpers. Third parties import *only* from here, giving a versionable seam.
- A scaffold (`npm run plugin:new <id>` or a documented "copy `src/plugins/_template/`") producing a compiling feature plugin with the 6-file domain slice, a route segment, a nav entry, a permission fragment, and a Jest test — the RED/GREEN starting point `claude.md` mandates.
- `docs/plugins/authoring.md` + `docs/plugins/architecture.md`, and a new `openspec/specs/` entry per real plugin (as `website-builder-plugin` already is).
- **Acceptance contract for open-source plugins:** reuse `DESIGN.md`'s "Definition of Done (Design)" (semantic tokens only, all states, keyboard/focus, 375px) plus the `oswp-ui-skill`, a required manifest, tests, and an OpenSpec spec. This answers the open question `DESIGN.md §14` already flags about community-contribution review.

**Rationale:** "easy to build addons, and open source" is a documentation-and-contract problem as much as a code one. A stable SDK boundary + a scaffold that starts green + a written design/acceptance bar is what lets outside contributors succeed without reading the whole app.

## Risks / Trade-offs

- **Schema is still central (Decision 5)** — the biggest gap between this and "true" plugins. Mitigation: honest docs, `Wedding` extension-point block, Tier-2 path defined.
- **Registry import remains explicit** — one line per plugin. Accepted: explicitness beats fragile globbing under Next/tRPC.
- **Router/permission derivation refactor touches hot paths** (`root.ts`, `auth-permissions.ts`). Mitigation: phased tasks, behavior-preserving, `website_builder` + themes as regression oracles; each phase independently shippable.
- **Route injection is convention, not runtime** — a plugin owns a filesystem segment. Mitigation: manifest declares `routeSegment`; build-time validation that it exists.

## Migration / Rollout

Phased, behavior-preserving (detailed in `tasks.md`):
1. Land the `~/plugin-sdk` types + registry contract with **zero** consumers (pure addition).
2. Derive `appRouter` from the registry; migrate one domain (`website`) as the pilot.
3. Derive nav + Settings > Plugins from the registry; migrate `website_builder`'s toggle/nav/gating onto the resolver.
4. Derive authz statement/roles from permission fragments.
5. Fold the theme registry under the manifest.
6. Ship SDK barrel, scaffold, and `docs/plugins/*`; convert `website_builder` and one theme into the two reference plugins.

Each phase keeps existing behavior green (the `website-builder-plugin` spec's graceful-degradation scenarios are the acceptance oracle) and is independently revertable.
