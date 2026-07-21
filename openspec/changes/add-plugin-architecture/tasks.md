# Implementation Tasks

Phased and behavior-preserving. Each phase is independently shippable; the `website-builder-plugin` graceful-degradation scenarios are the regression oracle throughout. Per `claude.md`, registry projections are pure functions written RED → GREEN.

## 1. Plugin SDK + manifest contract (pure addition, zero consumers)

- [ ] 1.1 Create `src/plugin-sdk/` barrel with `PluginManifest`, `FeaturePlugin`, `ThemePlugin`, `NavContribution`, `PermissionFragment`, and `PluginId` types
- [ ] 1.2 Re-export the UI kit (`src/components/ui/*`), design-token helpers, and tRPC builder/types from the barrel as the stable author surface
- [ ] 1.3 Add `~/plugin-sdk` path alias in `tsconfig.json`; write a failing type-level test asserting the manifest metadata module imports with no React/server deps
- [ ] 1.4 Document the contract inline; verify `biome check` and `tsc` pass

## 2. Central registry + projections (pure, TDD)

- [ ] 2.1 Write failing unit tests for the registry: duplicate-id rejection, missing-`dependsOn` rejection, deterministic ordering
- [ ] 2.2 Implement `src/plugins/registry.ts` (explicit import list) and `src/plugins/projections.ts`
- [ ] 2.3 Write failing tests for `buildAppRouter`, `buildSidebarSections`, `buildAuthzStatement`, `buildRoleGrants`, `listCoupleToggleablePlugins`
- [ ] 2.4 Implement the projections as pure functions of the registry
- [ ] 2.5 Write failing tests for `isPluginEnabledForWedding` covering every three-tier combination (registered × policy × couple/alwaysOn/non-toggleable)
- [ ] 2.6 Implement the resolver with an injectable `policy` port; default policy permits all

## 3. Derive the tRPC router (pilot: `website`)

- [ ] 3.1 Wrap the existing `website` domain as a `FeaturePlugin` manifest (no logic change)
- [ ] 3.2 Rewrite `src/server/api/root.ts` to compose core routers + `buildAppRouter(registry)`; keep all current procedure paths stable
- [ ] 3.3 Regression: full tRPC type-check + existing domain tests green; assert no procedure path changed

## 4. Derive nav + Settings > Plugins

- [ ] 4.1 Replace static `SIDEBAR_SECTIONS` with `buildSidebarSections(registry, { role, enabledPluginIds })`, preserving the `canViewPlanning` role gate (`sidebar-nav.tsx`)
- [ ] 4.2 Make `plugins-settings-card.tsx` iterate `listCoupleToggleablePlugins(registry)` instead of hardcoding `website_builder`
- [ ] 4.3 Change `toggleWeddingAddOnSchema` from `z.enum(['website_builder'])` to "any couple-toggleable registered id"; add failing validator tests for unknown/non-toggleable ids
- [ ] 4.4 Add the plugin-route enable-callout gate to the shared route helper so any plugin route degrades like `/website` does today

## 5. Derive permissions

- [ ] 5.1 Give the `website` (and pilot) plugin a `PermissionFragment`; write failing tests that `requirePermission` behaves identically before/after
- [ ] 5.2 Compose `authzStatement` + role grants in `auth-permissions.ts` via `buildAuthzStatement`/`buildRoleGrants`
- [ ] 5.3 Regression: role-matrix tests (owner/admin/member/viewer) unchanged

## 6. Migrate `website_builder` to the reference full-feature plugin

- [ ] 6.1 Move `website_builder`'s toggle, nav item, route gating, and permissions fully onto the registry/resolver
- [ ] 6.2 Run every scenario in `openspec/specs/website-builder-plugin/spec.md` as the acceptance oracle (RSVP-always-on, minimal public page, auto-create, callout) — all must stay green
- [ ] 6.3 Update `openspec/specs/website-builder-plugin/spec.md` (MODIFIED) to note it is now an instance of the general registry

## 7. Fold theme registry under the manifest

- [ ] 7.1 Wrap `classic`/`aurelia`/`voyage` as `ThemePlugin` manifests; map `catalog.ts` entries onto `PluginManifest`
- [ ] 7.2 Make `src/templates/registry.ts` a theme-subtype projection of the central registry; keep `resolveTemplate` + default fallback behavior identical
- [ ] 7.3 Ensure themes are instance-gated and excluded from the Settings > Plugins toggle list (choose-one via `Website.templateId`)
- [ ] 7.4 Regression: public site renders each theme unchanged

## 8. UI slots + keyed section/editor registries

- [ ] 8.1 Add the slot registry types to `~/plugin-sdk` (`SlotContribution { slot, order, gate, Component }`) and a `<Slot name>` primitive that renders active contributions ordered by `order`, gated by the enablement resolver
- [ ] 8.2 Enforce the RSC-safe pattern: slot components resolved as build-time module references via the registry (React-free metadata / runtime split), never passed across the server/client boundary; add a failing test that guards this
- [ ] 8.3 Refactor `src/components/dashboard/planning-overview.tsx` to render `<Slot name="dashboard.widgets">`; move existing cards to core contributions with identical output; snapshot-test unchanged render
- [ ] 8.4 Refactor `src/app/(authenicated)/settings/page.tsx` to render `<Slot name="settings.cards">`; move existing cards to core contributions
- [ ] 8.5 Replace each template's `switch(section.type)` (`classic`/`aurelia`/`voyage` `sections.tsx`) with a keyed lookup: a shared default renderer per section type + optional per-template override; verify each template renders identically
- [ ] 8.6 Replace the `SectionFields` switch in `sections-editor.tsx` with a keyed `Editor` from the section registry; keep Zod validation on client + server unchanged
- [ ] 8.7 Define the Display+Editor pair contract for content plugins in the SDK; document the section-plugin author path

## 9. Event system (after-commit, best-effort)

- [ ] 9.1 Promote `src/lib/analytics/events.ts` taxonomy to a typed `DomainEvent` union with per-event payload types in `~/plugin-sdk`
- [ ] 9.2 Add manifest `emit`/`subscribe` declarations; registry validates subscribed/emitted names against the catalog (fail fast on unknown)
- [ ] 9.3 Implement `src/server/infrastructure/events/` dispatcher with the never-throw contract; per-subscriber isolation; active-plugin gating; no ordering guarantee
- [ ] 9.4 Write failing tests: one subscriber throwing does not affect others or the request; inactive plugin's subscriber not called; no delivery on rollback; delivery after commit
- [ ] 9.5 Generalize `analyticsMiddleware` (`trpc.ts`) to also dispatch each successful mutation's canonical event to the bus (automatic seam)
- [ ] 9.6 Add explicit `emit()` in application orchestrators (e.g. `RsvpSubmissionService`) and non-tRPC entrypoints (Telegram webhook, cron, Etta approval route/tools)
- [ ] 9.7 Implement the reference notifications subscriber: `rsvp.*.submitted → Notification` row, activating the unused `Notification` model
- [ ] 9.8 Add the client event→query-key invalidation map to the SDK; document the client reactivity pattern (no mandatory global store)
- [ ] 9.9 Document the transactional-outbox upgrade path as an explicit non-goal/future in `docs/plugins/architecture.md`

## 10. Author experience: scaffold + docs + reference

- [ ] 10.1 Add `src/plugins/_template/` (or `npm run plugin:new <id>`) producing a compiling feature plugin: 6-file domain slice, route segment, nav entry, permission fragment, and a passing Jest test (starts GREEN)
- [ ] 10.2 Write `docs/plugins/architecture.md` (the model, the three tiers, the schema-central caveat + Tier-2 path, slots, events + outbox non-goal) and `docs/plugins/authoring.md` (SDK, scaffold, manifest, slots, emit/subscribe, acceptance checklist)
- [ ] 10.3 Encode the open-source acceptance contract: reuse `DESIGN.md` "Definition of Done (Design)" + `oswp-ui-skill` + required manifest/tests/OpenSpec spec; link from `CONTRIBUTING.md`
- [ ] 10.4 Build one brand-new example plugin end-to-end (e.g. `song-requests`) via the scaffold — exercising a route, a `dashboard.widgets` slot contribution, and an event subscriber — as the living tutorial and second contract witness

## 11. Instance policy (platform-admin tier)

- [ ] 11.1 Implement the env-backed `policy` port (`OSWP_PLUGIN_POLICY` / `OSWP_DISABLED_PLUGINS`) consumed by the resolver
- [ ] 11.2 Tests: instance-gated plugin is non-navigable, non-toggleable, and route-inaccessible fleet-wide; default (unset) permits all
- [ ] 11.3 Document the deferred `PluginPolicy` table as the graduation path when a hosted control panel exists (non-goal here)
