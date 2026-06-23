## 1. Schema & Migration

- [x] 1.1 Remove `url` field from `Website` model in `prisma/schema.prisma`
- [x] 1.2 Add `templateId String?` field to `Website` model in `prisma/schema.prisma`
- [x] 1.3 Add `WebsiteSection` model to `prisma/schema.prisma` (fields: id, websiteId, type, isEnabled, position, content Json, createdAt, updatedAt)
- [x] 1.4 Add relation `websiteSections WebsiteSection[]` to `Website` model
- [ ] 1.5 Run `npx prisma migrate dev --name wedding-website-sections` to generate and apply migration
- [x] 1.6 Write backfill: for any `Wedding` with `"website"` in `enabledAddOns` but without `"website_builder"`, add `"website_builder"` to `enabledAddOns`

## 2. Domain Layer — Website

- [x] 2.1 Remove `url` field from `Website` types in `src/server/domains/website/website.types.ts`
- [x] 2.2 Remove `url` field from the website Zod validator in `src/server/domains/website/website.validator.ts`
- [x] 2.3 Remove `url` field writes from `website.repository.ts` (create, update methods)
- [x] 2.4 Remove `url` field from `website.router.ts` input/output schemas
- [x] 2.5 Add `computeWebsiteUrl(subUrl: string): string` helper in `src/server/domains/website/website.utils.ts` returning `${APP_URL}/w/${subUrl}`
- [x] 2.6 Add `"website"` to `RESERVED_ROOT_SEGMENTS` validation in the `subUrl` validator (blocks slug value `"website"`)

## 3. Domain Layer — WebsiteSection

- [x] 3.1 Create `src/server/domains/website-section/website-section.types.ts` with `WebsiteSection` type, `WebsiteSectionType` enum (`HOME`), and `HomeSectionContent` type (`{ introText: string }`)
- [x] 3.2 Create `src/server/domains/website-section/website-section.validator.ts` with Zod schemas for creating/updating sections; `introText` max 2000 chars
- [x] 3.3 Create `src/server/domains/website-section/__mocks__/website-section.repository.ts` mock
- [x] 3.4 Write unit tests for `WebsiteSectionService` (TDD: red first)
- [x] 3.5 Create `src/server/domains/website-section/website-section.repository.ts` with methods: `create`, `findByWebsiteId`, `findByWebsiteIdAndType`, `update`
- [x] 3.6 Create `src/server/domains/website-section/website-section.service.ts` with methods: `createHomeSection`, `getByWebsiteId`, `updateHomeSection`
- [x] 3.7 Create `src/server/domains/website-section/website-section.router.ts` with tRPC procedures: `updateHomeSection` (protectedProcedure)
- [x] 3.8 Register `websiteSectionRouter` in the root tRPC router

## 4. Application Layer

- [x] 4.1 Update `website-management.service.ts` `enableWebsite()` to: stop writing `url` field; create a default HOME `WebsiteSection` after website creation
- [x] 4.2 Update `fetchWeddingData()` to include HOME section `introText` in the returned public data payload
- [x] 4.3 Update `website-management.service.ts` to add `computeWebsiteUrl` usage wherever full URL is returned to clients

## 5. Routing & Middleware

- [x] 5.1 Add `"website"` to `RESERVED_ROOT_SEGMENTS` set in `src/middleware.ts`
- [x] 5.2 Update middleware public path detection to recognise `/w/[slug]` and `/w/[slug]/rsvp` as public paths (replace `/{slug}` pattern)
- [x] 5.3 Add redirect logic in middleware: `/{slug}` → `/w/{slug}` for valid non-reserved slugs (temporary 302)
- [x] 5.4 Rename `src/app/[websiteSubUrl]/` directory to `src/app/w/[websiteSubUrl]/` (moves public website route to new path)
- [x] 5.5 Verify `src/app/w/[websiteSubUrl]/page.tsx` and `src/app/w/[websiteSubUrl]/rsvp/page.tsx` resolve correctly after rename

## 6. Internal Editor Route

- [x] 6.1 Create `src/app/(authenicated)/website/page.tsx` — server component that checks `website_builder` in `enabledAddOns`
- [x] 6.2 If plugin disabled: render `<WebsiteDisabledCallout />` component with link to Settings
- [x] 6.3 If plugin enabled: auto-create `Website` + HOME section if not exists; render `<WebsiteEditor />` component
- [x] 6.4 Create `src/app/_components/website/website-editor.tsx` — client component with textarea for `introText`, save button, tRPC mutation
- [x] 6.5 Create `src/app/_components/website/website-disabled-callout.tsx` — informational card with Settings link
- [x] 6.6 Display the computed public website URL (`/w/[subUrl]`) in the editor as a copyable link

## 7. Public Website Page

- [x] 7.1 Update `src/app/w/[websiteSubUrl]/page.tsx` to read `website_builder` status from fetched wedding data
- [x] 7.2 If `website_builder` disabled: render minimal page (couple names + conditional RSVP link)
- [x] 7.3 If `website_builder` enabled: render full page including HOME section `introText` (when non-empty)
- [x] 7.4 Create `<WebsiteMinimalPage />` component (couple names, optional RSVP link)
- [x] 7.5 Update `<WeddingWebsite />` (full page) component to render `introText` below existing content when non-empty

## 8. Sidebar Navigation

- [x] 8.1 Add "Wedding Website" nav item to `src/components/nav/sidebar-nav.tsx` linking to `/website`
- [x] 8.2 Choose appropriate icon for the nav item (consistent with existing nav items)

## 9. Settings — Plugins Tab

- [x] 9.1 Add a "Plugins" section to `src/app/(authenicated)/settings/page.tsx`
- [x] 9.2 Create `src/app/_components/settings/plugins-settings-card.tsx` with a toggle for "Public Wedding Website"
- [x] 9.3 Wire toggle to tRPC mutation that adds/removes `"website_builder"` from `Wedding.enabledAddOns`
- [x] 9.4 Add tRPC procedure `wedding.toggleAddOn` (or reuse/extend existing) to manage `enabledAddOns` array

## 10. Tests

- [x] 10.1 Unit tests for `WebsiteSectionService` — createHomeSection, updateHomeSection, validation rules
- [x] 10.2 Unit tests for `WebsiteSectionRepository` — create, findByWebsiteId, update
- [x] 10.3 Unit tests for `computeWebsiteUrl` helper
- [x] 10.4 Unit tests for updated `WebsiteManagementService.enableWebsite()` — assert HOME section created
- [x] 10.5 Unit tests for middleware routing logic — `/w/[slug]` treated as public, `/{slug}` redirect, `website` reserved

## 11. Cleanup

- [x] 11.1 Remove references to `Website.url` from any components that previously read it (search for `website.url` and `website?.url`)
- [x] 11.2 Update any tRPC response type consumers that expected a `url` field on Website
- [x] 11.3 Verify `npm run build` passes with no TypeScript errors
- [x] 11.4 Verify `npm run lint` passes with no errors
- [x] 11.5 Run `npm run test:unit` — all tests pass
