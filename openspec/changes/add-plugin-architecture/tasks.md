# Implementation Tasks

Grouped by scope tier (see `proposal.md` → Scope & Sequencing). **Tier 1 is the recommendation; it removes existing duplication and leads with themes.** Tier 2 is designed but demand-gated — build a phase only when a second concrete case needs it. Tier 3 is deferred. Each phase is behavior-preserving; the `website-builder-plugin` graceful-degradation scenarios are the regression oracle. Per `claude.md`, registry projections are pure functions written RED → GREEN.

---

## Tier 1 — Do now (reduces existing duplication; themes lead)

### 1. Minimal plugin SDK + registry (only what Tier 1 needs)

- [ ] 1.1 Create `src/plugin-sdk/` barrel with `PluginManifest`, `ThemePlugin`, a minimal `FeaturePlugin` (nav only for now), `NavContribution`, `PluginId`; re-export the UI kit + design tokens
- [ ] 1.2 Add `~/plugin-sdk` path alias; failing type-test that manifest metadata imports with no React/server deps
- [ ] 1.3 Implement `src/plugins/registry.ts` (explicit import list) with duplicate-id + missing-`dependsOn` rejection (RED → GREEN)
- [ ] 1.4 Implement `isPluginEnabledForWedding` for the **couple** tier (`enabledAddOns`) and **self-hoster** tier (registry presence / `OSWP_DISABLED_PLUGINS`); instance tier stubbed to "permit all" (Tier 2 fills it). Cover all combinations in tests

### 2. Plugin-ready templates — the flagship

- [ ] 2.1 Build a base template implementing every surface (`Home`, `HomeMobile`, `Minimal`, `SaveTheDate`, `Invitation`, `Sections`) from `WeddingPageData` using semantic tokens; snapshot it
- [ ] 2.2 Make theme `components` optional/partial; update `resolveTemplate` to merge a theme's components over the base defaults, preserving the unknown-`templateId` default fallback (failing tests first)
- [ ] 2.3 Replace each template's `switch(section.type)` (`classic`/`aurelia`/`voyage` `sections.tsx`) with a shared **keyed section-renderer registry** (default renderer per type + optional per-template override); verify each template renders identically
- [ ] 2.4 Replace the `SectionFields` switch in `sections-editor.tsx` with a keyed `Editor` from the section registry; keep Zod validation on client + server unchanged
- [ ] 2.5 Wrap `classic`/`aurelia`/`voyage` as `ThemePlugin` manifests; map `catalog.ts` entries onto `PluginManifest`; make `src/templates/registry.ts` the theme projection of the central registry — `resolveTemplate` + default fallback behavior identical
- [ ] 2.6 Add a `template:new <id>` scaffold that generates a compiling, registered **token-only** theme; assert the generated theme appears in the picker and renders all surfaces
- [ ] 2.7 Add a seed-data preview path (model on the existing `design-system` route) that renders any theme's surfaces without a live wedding
- [ ] 2.8 Registry validates required theme metadata (`name`, `description`, `swatches`) — fail fast on missing
- [ ] 2.9 Write `docs/plugins/themes.md`: token-only quickstart, partial override, section override, the design acceptance bar (`DESIGN.md` DoD + `oswp-ui-skill`)

### 3. Registry-driven nav + generalized couple toggle

- [ ] 3.1 Replace static `SIDEBAR_SECTIONS` with `buildSidebarSections(registry, { role, enabledPluginIds })`, preserving the `canViewPlanning` role gate (`sidebar-nav.tsx`)
- [ ] 3.2 Make `plugins-settings-card.tsx` iterate couple-toggleable registered plugins instead of hardcoding `website_builder`
- [ ] 3.3 Change `toggleWeddingAddOnSchema` from `z.enum(['website_builder'])` to "any couple-toggleable registered id"; failing validator tests for unknown / non-toggleable ids
- [ ] 3.4 Represent `website_builder` as a manifest so its toggle + nav + route gating flow through the registry; run every `openspec/specs/website-builder-plugin/spec.md` scenario as the acceptance oracle (all stay green)

---

## Tier 2 — Demand-gated (build a phase only when a second concrete case needs it)

> Do **not** start these without a real feature that requires them. Rationale in `design.md` → Scope & sequencing: an event bus with zero subscribers, or a widget slot with zero widgets, is speculative complexity.

### 4. tRPC router + permissions derivation from the registry

- [ ] 4.1 Wrap the `website` domain as a `FeaturePlugin` with a `router`; rewrite `root.ts` as core + `buildAppRouter(registry)`, keeping every procedure path stable
- [ ] 4.2 Give plugins a `PermissionFragment`; compose `authzStatement` + role grants via `buildAuthzStatement`/`buildRoleGrants`; role-matrix tests (owner/admin/member/viewer) unchanged

### 5. UI widget slots

- [ ] 5.1 Add `SlotContribution { slot, order, gate, Component }` + `<Slot name>` to the SDK; enforce build-time module references (no component props across the RSC boundary) with a guard test
- [ ] 5.2 Refactor `planning-overview.tsx` to `<Slot name="dashboard.widgets">` and `settings/page.tsx` to `<Slot name="settings.cards">`; move existing cards to core contributions with identical output (snapshot)

### 6. Event system (after-commit, best-effort)

- [ ] 6.1 Promote `src/lib/analytics/events.ts` taxonomy to a typed `DomainEvent` union; add manifest `emit`/`subscribe` with catalog validation
- [ ] 6.2 Implement `src/server/infrastructure/events/` dispatcher (never-throw, per-subscriber isolation, active-plugin gating, no ordering); failing tests: one subscriber throwing doesn't affect others/request; no delivery on rollback; delivery after commit
- [ ] 6.3 Generalize `analyticsMiddleware` to also dispatch (automatic seam); add explicit `emit()` in orchestrators + non-tRPC entrypoints (Telegram, cron, Etta)
- [ ] 6.4 Reference subscriber: `rsvp.*.submitted → Notification` row (activates the unused model); add the client event→query-key invalidation map to the SDK

### 7. Instance policy (platform-admin tier)

- [ ] 7.1 Implement the env-backed `policy` port (`OSWP_PLUGIN_POLICY`) consumed by the resolver's instance tier; tests: instance-gated plugin is non-navigable/non-toggleable/route-inaccessible fleet-wide; default permits all

### 8. Full feature-plugin author experience

- [ ] 8.1 `src/plugins/_template/` (or `npm run plugin:new <id>`) producing a compiling feature plugin: 6-file domain slice, route segment, nav entry, permission fragment, passing Jest test (starts GREEN)
- [ ] 8.2 `docs/plugins/architecture.md` + `docs/plugins/authoring.md` (SDK, scaffold, manifest, slots, emit/subscribe, schema-central caveat, acceptance checklist); link from `CONTRIBUTING.md`
- [ ] 8.3 Build one brand-new example feature plugin end-to-end (e.g. `song-requests`) exercising a route, a `dashboard.widgets` slot, and an event subscriber — living tutorial + second contract witness

---

## Tier 3 — Deferred (design only; do not build without clear demand)

> Specified in `design.md` (Decisions 1, 4, 5, 9) so Tier 1–2 seams stay forward-compatible. Not to be implemented as part of this effort.

- [ ] Installable npm-package plugins (`prismaSchemaFolder` merge, published `@oswp/plugin-sdk`, package-reading registry)
- [ ] Runtime-dynamic plugins (rejected under the current stack; revisit only with a plugin runtime/sandbox)
- [ ] Transactional outbox for guaranteed (at-least-once) event delivery
- [ ] `PluginPolicy` DB table for a hosted control panel
- [ ] Plugin marketplace / installer UI
