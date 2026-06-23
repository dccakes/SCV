## Why

Users have no way to build or publish a public wedding website from within the app. The Website domain exists and the RSVP flow works, but there is no internal editor, no discoverable nav entry point, and no content model for the website itself. This adds the foundational layer: a plugin-gated website builder with section-based content, a proper public URL structure aligned with industry patterns, and always-on RSVP access regardless of whether the builder is enabled.

## What Changes

- **BREAKING** Public wedding website URLs move from `/{slug}` to `/w/[slug]` (consistent with Zola's `/wedding/[slug]` and TheKnot's `/ourwedding/[slug]` patterns)
- New internal editor route at `/website` (added to `RESERVED_ROOT_SEGMENTS` in middleware)
- "Wedding Website" added to the sidebar navigation
- `Website.url` field removed — the full URL is now computed from `subUrl` at runtime
- New `WebsiteSection` Prisma model for section-based content (type, isEnabled, position, JSON content)
- `"website_builder"` added to `enabledAddOns` as the plugin flag controlling the builder; RSVP remains always accessible
- New Settings > Plugins tab with a toggle to enable/disable the website builder
- When builder is disabled: public `/w/[slug]` shows a minimal page (couple names + RSVP link only)
- When builder is disabled: internal `/website` shows a callout prompting the user to enable in Settings
- Demo scope: HOME section only, with a single `introText` textarea rendered on the public page
- `templateId: String?` added to `Website` for future template selection (nullable, unused for now)

## Capabilities

### New Capabilities

- `wedding-website-routing`: Public URL restructured to `/w/[slug]`; `/website` added as a reserved authenticated route; `Website.url` stored field removed in favour of computed URLs
- `website-content-sections`: New `WebsiteSection` model backing section-based website content; HOME section with `introText` as the initial demo section
- `website-builder-plugin`: Plugin toggle system (`website_builder` in `enabledAddOns`), sidebar nav item, internal editor page, conditional public page rendering (minimal vs full), Settings > Plugins tab

### Modified Capabilities

<!-- No existing specs exist — all capabilities are new -->

## Impact

- `prisma/schema.prisma`: Add `WebsiteSection` model; add `templateId` to `Website`; remove `url` field from `Website`
- `src/middleware.ts`: Add `"website"` to `RESERVED_ROOT_SEGMENTS`; update public path detection from `/{slug}` to `/w/[slug]`
- `src/app/[websiteSubUrl]/` → renamed/moved to `src/app/w/[websiteSubUrl]/`
- `src/app/(authenticated)/website/` — new internal editor route
- `src/components/nav/sidebar-nav.tsx` — add Wedding Website nav item
- `src/app/(authenticated)/settings/` — add Plugins tab
- `src/server/domains/website/` — remove `url` field from types, validators, repository, router
- New `WebsiteSection` domain: repository, service, types, validator, router
- `src/server/application/website-management/` — update `enableWebsite()` to create default HOME section; update URL computation helpers
- Any component that references `Website.url` directly needs updating to compute the URL from `subUrl`
