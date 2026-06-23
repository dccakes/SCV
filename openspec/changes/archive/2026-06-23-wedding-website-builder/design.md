## Context

The app has a functioning `Website` domain (password protection, RSVP toggle, cover photo, `subUrl` slug) and a working RSVP flow at `/{slug}/rsvp`. However:

- Public wedding websites are served at root-level `/{slug}`, which requires a `RESERVED_ROOT_SEGMENTS` blocklist in middleware to avoid collisions with app routes
- The `Website` model stores a redundant `url` field (the full URL as a string) alongside `subUrl`
- There is no internal editor — website management is a modal buried on the dashboard
- There is no content model — the public page only renders couple names, cover photo, and events pulled from other models
- There is no way to toggle the website builder on/off; it's treated as one monolithic add-on (`"website"` in `enabledAddOns`)
- The sidebar has no entry point for the website feature

Industry research shows Zola (`/wedding/[slug]`), TheKnot (`/ourwedding/[slug]`), and the section-based editor pattern as the established standard.

## Goals / Non-Goals

**Goals:**
- Restructure public URLs to `/w/[slug]` — a prefixed path that eliminates root-level collision risk and aligns with industry patterns
- Add `/website` as a dedicated authenticated editor route with a sidebar nav entry
- Introduce a `WebsiteSection` model supporting section-based content, enabling future template swappability
- Separate RSVP (always on) from the website builder (plugin-gated via `website_builder` in `enabledAddOns`)
- Add a Settings > Plugins tab where users can toggle the website builder on/off
- Demo scope: HOME section with a single `introText` field, rendered on the public page
- Clean up: remove `Website.url` (redundant stored field); compute full URL from `subUrl` at runtime

**Non-Goals:**
- Multiple templates or theme selection (future — `templateId` field added but unused)
- Subdomain routing (`[slug].domain.com`) — architecture is compatible but out of scope
- Rich content sections beyond HOME (Our Story, Wedding Party, Photos, etc.) — section model supports them but they are not built
- RSVP form changes — existing flow is untouched
- Guest-facing password protection changes

## Decisions

### D1: `/w/[slug]` prefix over root-level `/{slug}`

**Chosen:** `/w/[slug]`

**Alternatives considered:**
- Keep `/{slug}` — simpler, used by WeddingWire, but requires maintaining the `RESERVED_ROOT_SEGMENTS` blocklist forever and makes subdomain routing harder to layer in later
- `/wedding/[slug]` (Zola's pattern) — more readable but longer; `/w/` is the minimal unambiguous prefix

**Rationale:** The prefix cleanly separates public wedding content from app routes with zero runtime logic. When subdomain routing is added later, the middleware can check hostname first and fall through to `/w/[slug]` as the canonical path — no blocklist needed.

### D2: Section-based content model over a flat `content` field

**Chosen:** `WebsiteSection` model (type, isEnabled, position, `content Json`)

**Alternatives considered:**
- Single `content: String?` on `Website` — fastest for demo, but is a throwaway field requiring a migration when templates arrive
- Block-based model (like Notion/Gutenberg) — more flexible but overly complex for a wedding website context; industry research shows section-based wins for this domain

**Rationale:** All major platforms (Zola, TheKnot) use section-based architecture. A section owns its shape via `type`; templates are just renderers over the same data. The demo uses one section with one JSON field — same DB effort as a flat field, correct long-term model.

### D3: `website_builder` as the plugin flag, RSVP always on

**Chosen:** `enabledAddOns` string `"website_builder"` gates the builder; RSVP has no gate

**Alternatives considered:**
- Single `"website"` flag gates everything — breaks the RSVP-is-a-utility guarantee
- Separate `isRsvpEnabled` on Website (already exists) as the only gate — conflates RSVP form management with builder feature access

**Rationale:** RSVP is infrastructure (guests need to respond regardless of whether the couple has built their site). The builder is a creative feature. They have different lifecycles and different reasons to be on/off.

### D4: Auto-create Website + HOME section on first `/website` visit

**Chosen:** Lazy creation on first authenticated visit to `/website`

**Alternatives considered:**
- Explicit "Enable website" CTA before editor loads — adds friction, no benefit at this stage
- Create Website record when wedding is created — premature, couple may not want a website

**Rationale:** Wedding creation is always step 1 in onboarding, so `weddingId` is always available. Lazy creation on `/website` visit means the user gets straight to the editor. The `enabledAddOns` check gates the editor regardless — if `website_builder` is not in the list the user sees the callout, not the editor.

### D5: Remove `Website.url`, compute at runtime

**Chosen:** Drop `url` field from schema

**Alternatives considered:**
- Keep `url` as a cache — avoids a small computation but adds mutation burden (update on every slug change, env change, or domain change)

**Rationale:** The full URL is `${APP_URL}/w/${subUrl}` — a trivial derivation. Storing it creates a class of sync bugs (stale URL if slug is edited, different URLs per environment). Remove it cleanly.

## Risks / Trade-offs

- **BREAKING URL change** (`/{slug}` → `/w/[slug]`): Any existing couples who have shared their website URL (e.g., on printed invitations) will have a broken link. → Mitigation: Add a redirect from `/{slug}` → `/w/[slug]` in middleware for a transition period. Remove after 6 months.

- **`Website.url` removal is a DB migration**: Existing rows have the field populated. → Mitigation: Run `ALTER TABLE` to drop the column; no data migration needed since the value is recomputable.

- **Section JSON shape is untyped at the DB level**: `content Json` is flexible but no DB-level constraint on shape. → Mitigation: Validate shape in the `WebsiteSection` service layer using Zod before writes; the type discriminant on `type` drives the expected shape.

- **`website_builder` not present in existing weddings' `enabledAddOns`**: Existing users who previously enabled the website will need the new flag added. → Mitigation: Migration script or lazy backfill: if `"website"` is in `enabledAddOns` and `"website_builder"` is not, treat it as enabled (and add it on next settings visit).

## Migration Plan

1. **Schema migration**: Drop `Website.url`; add `Website.templateId?`; add `WebsiteSection` table
2. **Middleware update**: Add `"website"` to `RESERVED_ROOT_SEGMENTS`; add `/w/[slug]` route handling; add `/{slug}` → `/w/[slug]` redirect
3. **App Router**: Rename `app/[websiteSubUrl]/` → `app/w/[websiteSubUrl]/`; add `app/(authenticated)/website/`
4. **Domain layer**: Remove `url` from Website types/validator/repository/router; add `WebsiteSection` domain
5. **Application layer**: Update `enableWebsite()` to seed HOME section; add URL computation helper
6. **UI**: Sidebar nav item; Settings Plugins tab; editor page; public page minimal/full states
7. **Backfill**: Script to add `"website_builder"` to `enabledAddOns` for any wedding that has `"website"` already set

**Rollback:** Revert middleware redirect; re-add `url` field (nullable) via migration; rename routes back. No data loss risk since `url` was computed anyway.

## Open Questions

- Should the `/{slug}` redirect be permanent (301) or temporary (302)? A 302 allows reverting without SEO penalty, but 301 is better for link equity once committed.
- When `website_builder` is disabled, should `/w/[slug]` still resolve (showing the minimal couple names + RSVP page)? **Decision from explore session: yes — minimal page always shown.**
- What is the exact shape of the HOME section `content` JSON for the demo? Proposed: `{ "introText": string }`.
