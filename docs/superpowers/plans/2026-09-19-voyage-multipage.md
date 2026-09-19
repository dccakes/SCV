# Voyage multi-page implementation plan

**Goal:** Turn the approved Voyage design into the same focused, shareable pages on desktop and mobile while retaining its visual identity.

**Architecture:** A Voyage page catalogue defines allowed slugs and navigation. A guarded public route uses the existing visitor loader and template theme. Server-rendered content reuses enabled website sections and registered events; a small client navigation component handles menus. Other templates and existing invitation/RSVP routes retain their behaviour.

**Constraints:** Preserve existing content and access checks. No database migration or deployment. Event names, dates, times, venue, attire and descriptions come from registered events. Missing attire uses clearly pending copy. WhatsApp has no active invite link. Puebla and Mexico have separate pages. English only for now; Spanish translation is explicitly deferred.

## Tasks

- [x] Add regression tests for page navigation, complete registered event details (including more than six), hotel links without blurbs, placeholder contact, and guarded routes.
- [x] Add `src/templates/voyage/site.ts` for page slugs, shared section lookup and UTC calendar-date helpers; add `components/site-shell.tsx` and replace `components/navbar.tsx` with persistent accessible navigation.
- [x] Add `components/weekend.tsx`, `components/stays.tsx` and `components/content-page.tsx`. Reuse destination/story/gallery/guide components. Show hotel booking details inline and keep links available without blurbs. Separate travel from hotels/FAQ and link related pages.
- [x] Replace the long homepage with hero, task shortcuts, event summary, story teaser, guide links and RSVP/contact. Retain old anchor destinations through redirects to the new pages.
- [x] Add `src/app/w/[websiteSubUrl]/[page]/page.tsx`, checking allowed slug, visitor access, template and website-builder availability; return safe metadata before access. Add Voyage navigation to RSVP.
- [x] Run focused Jest tests, TypeScript and Biome checks, then browser-check desktop/mobile routing, navigation, overflow, placeholders and populated fixture content. Record limitations.

## Verification cases

`npm run test:unit -- --runInBand tests/unit/templates/voyage-pages.test.tsx tests/unit/templates/voyage-mexico-guide.test.tsx tests/unit/app/voyage-content-page.test.tsx`

Assert that home links to real routes rather than containing the full travel guides; all registered events appear chronologically with dates/venue/attire; absent fields read as pending, never invented; hotel URLs survive absent blurbs; no live WhatsApp link exists; unknown slugs and unsupported templates 404; password-required responses expose no wedding content; valid invite access is delegated to the existing loader. Verify mobile menu closes on navigation and Escape, with the current page identified.

## Validation notes

Browser checks used a temporary development fixture because the local database connection was refused. All eight content pages rendered without horizontal overflow at 390px; desktop navigation, mobile navigation and legacy anchor routing were checked. The Wedding Weekend WCAG A/AA automated scan reported zero violations after improving the terracotta text contrast. The temporary fixture routes were removed. No deployment or database changes were made.

Final checks: 97 tests passed across 13 focused suites, scoped Biome checks passed for all 23 changed TypeScript files, and the production build (including TypeScript) passed. The build retains the existing Edge Runtime warning for `process.stderr` in `src/instrumentation.ts`. `git diff --check` passed.
