## Context

The vendor section is currently text-only. Couples managing 10–20 vendors struggle to visually distinguish them — particularly venues — without switching to browser tabs. The app already has a mature Vercel Blob pipeline (upload API, `VendorQuoteFile` pattern, blob cleanup on delete) that can be extended directly. The `VendorQuoteFile` model serves as the template for the new `VendorImage` model.

The change also bundles targeted UI polish: standardized empty states, a visual distinction between Scratchpad and Interaction Log, and card cleanup (typography, delete button, price formatting). These share the same component files as the image feature, making them natural to co-ship.

## Goals / Non-Goals

**Goals:**
- Attach up to 5 images to any vendor (all categories, optional)
- Designate one image as the cover; render it as a card thumbnail
- Auto-gather images from the vendor's website with a user-facing picker
- Standardize empty states and clean up card/detail panel UI

**Non-Goals:**
- Guest-facing image display (wedding website integration — kept separate)
- Google Places API or any paid image source
- Image cropping, resizing, or editing within the app
- Mood boarding or collections across vendors

## Decisions

### 1. New `VendorImage` model, not repurposing `VendorQuoteFile`

Quote files are scoped to a quote (pricing context); vendor images are scoped to the vendor entity itself (identity/reference context). Mixing them would require nullable `quoteId`, complicate cleanup logic, and blur the semantic boundary. A dedicated model is cleaner.

```
VendorImage {
  id        String   (cuid)
  vendorId  String   (FK → Vendor, cascade delete)
  url       String   (Vercel Blob public URL)
  key       String   (Vercel Blob key, for deletion)
  size      Int
  name      String
  isPrimary Boolean  @default(false)
  order     Int      @default(0)
  source    String   @default("manual")  // "manual" | "website"
  createdAt DateTime
}
```

`isPrimary` is the cover flag. Only one image per vendor may have `isPrimary: true` — enforced at the service layer (set new primary → clear others). `order` is reserved for future drag-to-reorder; not exposed in v1.

**Alternative considered**: Adding an `imageUrl` string directly to `Vendor`. Rejected — doesn't support multiple images, no blob key for cleanup, no ordering.

### 2. Website scraping for auto-gather (no external API)

Auto-gather fetches the vendor's `website` URL server-side, extracts candidate images using heuristics (Open Graph `og:image`, `twitter:image`, `<img>` tags with dimensions ≥ 400px, excluding icons/SVGs), and returns deduplicated URLs to the client for a picker. The server then proxy-downloads selected images into Vercel Blob (so URLs are owned by us, not fragile external links).

**Alternative considered**: Google Places Photos API. Rejected — requires API key, per-request cost, and additional setup not yet in the stack. Can be added later as a second source alongside website scraping.

**Alternative considered**: Instagram API. Rejected — Instagram Graph API requires OAuth flow per user and does not support unauthenticated brand page image access reliably.

### 3. Reuse existing upload pipeline for user-uploaded images

`/api/blob/upload` already handles auth, file type validation, and size limits. `uploadFiles()` in `src/lib/blob.ts` handles concurrent client-side uploads with cleanup on failure. New tRPC procedures (`saveImages`, `deleteImage`, `setCoverImage`) follow the same pattern as `saveQuoteFiles` / `deleteQuoteFile`.

### 4. Max 5 images enforced at service layer

The limit is a UX decision (enough to capture a venue, not overwhelming). It's enforced in `VendorService` before calling the repository, returning a `BAD_REQUEST` error if the limit would be exceeded. The constant `MAX_IMAGES_PER_VENDOR = 5` is added to `upload-config.ts`.

### 5. Card thumbnail: single cover image, left-aligned, hidden when absent

The card gets a small (48×48px, rounded) cover image slot on the left. When no cover image exists, the slot is not rendered — the card looks identical to today. This avoids placeholder noise across vendors that have no images.

### 6. Detail panel: image gallery at top, before Details section

The gallery sits immediately below the vendor name/status header. Empty state: dashed-border box with camera icon, "No photos yet" label, "Upload photos" button, and conditional "Find from website" button (only if `vendor.website` is set). Populated state: 3-column grid of thumbnails (max 5), each with hover actions (set cover, delete), plus an "Add photos" affordance until the max is reached.

### 7. Scratchpad / Interaction Log: visual treatment only, no data model change

The behavioral requirements in `vendor-notes` spec are unchanged. The distinction is communicated purely through UI:

- **Scratchpad**: slightly warm background tint, serif font (existing), pencil icon in section header, "Save" button label
- **Interaction Log**: standard background, sans font, clock/timeline icon, compact single-line input above the timeline, "Log" button label, timeline dots with actor badge (`you` / `Etta`)

No new API procedures, no schema changes.

## Risks / Trade-offs

**Website scraping fragility** → Mitigation: treat failures gracefully — if fetch fails or no usable images are found, show a clear message ("We couldn't find images on their site") with a fallback to manual upload. Don't surface HTTP errors to the user.

**CORS / CSP on scraped image URLs** → Mitigation: proxy-download selected images into Vercel Blob during the picker confirmation step. The client never loads images directly from the vendor's domain.

**Blob storage cost growth** → At 8MB max per image × 5 images × ~20 vendors per wedding, a well-stocked account is ~800MB. Acceptable at current scale. Revisit with pricing tiers later.

**`isPrimary` race condition (concurrent saves)** → Mitigation: `setCoverImage` wraps the clear-others + set-new in a Prisma transaction.

## Migration Plan

Fully additive — no existing data is modified.

1. Add `VendorImage` model to Prisma schema
2. Run migration (`prisma migrate dev`)
3. Deploy — existing vendors simply have no images; UI degrades gracefully

Rollback: drop the `VendorImage` table (no foreign key references from existing models). Blob files would need manual cleanup if any were uploaded before rollback.

## Open Questions

- Should "Find from website" be available for vendors with no website URL set? (Current decision: hide the button; show only manual upload)
- In a future phase, should `order` enable drag-to-reorder in the gallery? Not in v1, but the column is there.
