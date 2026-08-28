## 1. Database & Schema

- [x] 1.1 Add `VendorImage` model to `prisma/schema.prisma` with fields: `id`, `vendorId` (FK cascade), `url`, `key`, `size`, `name`, `isPrimary` (default false), `order` (default 0), `source` (default "manual"), `createdAt`, `updatedAt`
- [x] 1.2 Add `images VendorImage[]` relation to `Vendor` model in schema
- [x] 1.3 Run `prisma migrate dev --name add-vendor-images` and verify migration

## 2. Upload Config

- [x] 2.1 Add `MAX_IMAGES_PER_VENDOR = 5` constant to `src/lib/upload-config.ts`

## 3. Domain Layer — Types & Validators

- [x] 3.1 Add `VendorImage` type to `server/domains/vendor/vendor.types.ts`
- [x] 3.2 Add Zod schemas to `vendor.validator.ts`: `saveVendorImagesSchema`, `deleteVendorImageSchema`, `setCoverImageSchema`, `fetchWebsiteImagesSchema`
- [x] 3.3 Update `EnrichedVendor` type to include `images: VendorImage[]` and `coverImage: VendorImage | null`

## 4. Domain Layer — Repository

- [x] 4.1 Write failing tests for new repository methods (`vendor.repository.test.ts`)
- [x] 4.2 Add `__mocks__` entries for new repository methods (`mockSaveImages`, `mockDeleteImage`, `mockSetCoverImage`, `mockGetVendorImageKeys`)
- [x] 4.3 Implement `saveImages(vendorId, images[])` in `vendor.repository.ts`
- [x] 4.4 Implement `deleteImage(imageId)` returning blob key for cleanup
- [x] 4.5 Implement `setCoverImage(vendorId, imageId)` wrapping clear + set in Prisma transaction
- [x] 4.6 Implement `getVendorImageKeys(vendorId)` for cascade cleanup on vendor delete
- [x] 4.7 Update `findById` query to include `images` ordered by `order asc, createdAt asc`
- [x] 4.8 Update `delete` logic to fetch image blob keys before deletion for cleanup

## 5. Domain Layer — Service

- [x] 5.1 Write failing tests for new service methods (`vendor.service.test.ts`)
- [x] 5.2 Implement `saveImages(userId, vendorId, images[])` — validates ownership, enforces 5-image limit, calls repository
- [x] 5.3 Implement `deleteImage(userId, imageId)` — validates ownership, calls repository, deletes blob
- [x] 5.4 Implement `setCoverImage(userId, vendorId, imageId)` — validates ownership, calls repository transaction
- [x] 5.5 Update `deleteVendor` to fetch and delete all image blobs before deleting the vendor record
- [x] 5.6 Implement `fetchWebsiteImages(userId, vendorId)` — validates ownership and website URL presence, calls scraper utility, returns candidate URLs

## 6. Website Image Scraper

- [x] 6.1 Create `src/server/infrastructure/scraper/website-images.ts` — server-side fetch of a URL, extract `og:image`, `twitter:image`, and `<img>` tags with width/height ≥ 400px, deduplicate, return array of URLs (max 20 candidates)
- [x] 6.2 Write unit tests for the scraper utility (mock fetch, test OG/Twitter/img extraction and deduplication)

## 7. tRPC Router

- [x] 7.1 Add `saveImages` protected procedure to `vendor.router.ts`
- [x] 7.2 Add `deleteImage` protected procedure to `vendor.router.ts`
- [x] 7.3 Add `setCoverImage` protected procedure to `vendor.router.ts`
- [x] 7.4 Add `fetchWebsiteImages` protected procedure to `vendor.router.ts`

## 8. UI — VendorCard

- [x] 8.1 Add cover image thumbnail (48×48px, rounded, left-aligned) to `vendor-card.tsx` — only rendered when `coverImage` is present
- [x] 8.2 Replace bare `✕` delete character with a proper `<button>` using an icon (e.g. `X` from lucide-react) with accessible label
- [x] 8.3 Fix arbitrary font sizes (`text-[0.52rem]`, `text-[0.55rem]`, `text-[0.72rem]`) — replace with nearest Tailwind scale values (`text-[10px]` or `text-xs`)
- [x] 8.4 Align price style to use `font-mono` (matching detail panel)

## 9. UI — VendorDetailPanel: Image Gallery

- [x] 9.1 Create `src/components/vendor/vendor-image-gallery.tsx` — gallery component accepting `images`, `vendorId`, `hasWebsite` props; renders grid, empty state, and add affordance
- [x] 9.2 Implement empty state: dashed border, camera icon, "No photos yet" label, "Upload photos" button, conditional "Find from website" button
- [x] 9.3 Implement populated state: 3-column grid of thumbnails, hover overlay with "Set as cover" (★) and "Remove" (×) actions, cover badge on primary image
- [x] 9.4 Implement "Add photos" affordance (shown when < 5 images): opens file picker via `react-dropzone`, uploads via existing `uploadFiles()`, calls `saveImages` mutation
- [x] 9.5 Implement "Find from website" flow: calls `fetchWebsiteImages` → shows `VendorImagePicker` modal with candidate images → on confirm calls `saveImages` with proxy-downloaded results
- [x] 9.6 Create `src/components/vendor/vendor-image-picker.tsx` — modal/drawer showing candidate image grid with checkbox selection (max 5), "Add selected (N)" confirm button, empty/error states
- [x] 9.7 Integrate `VendorImageGallery` into `vendor-detail-panel.tsx` immediately below the header section, before the Details section
- [x] 9.8 Wire `setCoverImage` mutation to the "Set as cover" action in the gallery

## 10. UI — VendorDetailPanel: Polish

- [x] 10.1 Standardize all empty states in the vendor section to: icon + short label + optional action (apply to: no vendors, no quotes, no notes, no category fields)
- [x] 10.2 Visually distinguish Scratchpad section: add pencil icon to section header, apply subtle warm background tint to the textarea container
- [x] 10.3 Visually distinguish Interaction Log section: add clock icon to section header, replace textarea with compact single-line input, add timeline dot styling to `VendorNoteTimeline`, update actor label to show "you" instead of "couple"
- [x] 10.4 Remove duplicate "Edit Details" button from the detail panel footer (keep header version)
- [x] 10.5 Fix "Quotes (0)" — hide count badge when `quotes.length === 0`
- [x] 10.6 Remove redundant "Scratchpad Notes" `<Label>` — section header already says "Scratchpad"

## 11. Proxy Download API

- [x] 11.1 Create `src/app/api/vendor/proxy-image/route.ts` — POST endpoint accepting `{ url, vendorId }`, validates session and vendor ownership, downloads the remote image, uploads to Vercel Blob via `putServerBlob`, returns `{ url, key, size, name }`
- [x] 11.2 Use this endpoint in the `VendorImageGallery` "Find from website" confirm step

## 12. Verification

- [x] 12.1 Run full test suite (`npm run test:unit`) — all tests passing
- [ ] 12.2 Manual: upload images to a vendor, verify thumbnail appears on card
- [ ] 12.3 Manual: set cover image, verify it appears in card and is marked in gallery
- [ ] 12.4 Manual: delete vendor, verify blob files are cleaned up (check Vercel Blob dashboard)
- [ ] 12.5 Manual: trigger "Find from website" on a vendor with a website URL, select images, verify they appear in gallery
- [ ] 12.6 Manual: attempt to add a 6th image — verify error state shown
- [ ] 12.7 Manual: verify card looks unchanged for vendors with no images
- [x] 12.8 Run `npm run lint` and `npm run build` — no errors
