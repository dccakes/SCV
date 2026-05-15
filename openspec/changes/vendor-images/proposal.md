## Why

Couples managing vendors in the app have no visual reference for who each vendor is — every entry is text-only, making it hard to remember a venue, florist, or caterer at a glance. Adding images gives couples a visual anchor when reviewing and comparing vendors, improving their ability to think and decide within the app rather than switching to browser tabs or notes apps.

## What Changes

- **New: Vendor image gallery** — any vendor (all categories, optional) can have up to 5 images attached directly to the vendor record, distinct from quote file attachments
- **New: Cover image** — couples designate one image as the cover; it appears as a small thumbnail on the vendor list card
- **New: Auto-gather from website** — when a vendor has a website URL, a "Find images" button fetches images from that site and presents a picker; couples select which to keep
- **New: Image empty state** — detail panel shows a clear prompt when no images are added yet, with "Upload photos" and (if website exists) "Find from website" actions
- **UI: Card thumbnail** — vendor card gains a small left-side cover image; cards without images are visually unchanged
- **UI: Standardized empty states** — all "no data yet" messages across the vendor section aligned to a consistent visual pattern (icon + label + optional action)
- **UI: Scratchpad vs Interaction Log distinction** — the two note sections are made visually distinct: Scratchpad reads like a personal notepad (warm tint, serif, pencil icon); Interaction Log reads like a timeline feed (structured entries, actor label, timeline dots)
- **UI: Card typography cleanup** — removes arbitrary fractional font sizes (`0.52rem`, `0.55rem`) in favor of Tailwind's standard scale
- **UI: Delete button** — bare `✕` character replaced with a proper accessible icon button
- **UI: Price formatting consistency** — card and detail panel use the same price style (`font-mono`)
- **UI: Remove duplicate "Edit Details"** — footer button in detail panel removed (already in header)
- **UI: "Quotes (0)" wording** — count hidden when zero; reads "Quotes" not "Quotes (0)"

## Capabilities

### New Capabilities
- `vendor-images`: Images attached to a vendor entity — upload, cover selection, max 5 per vendor, auto-gather from vendor website with picker UI, Vercel Blob storage, cleanup on vendor delete

### Modified Capabilities
<!-- None: vendor-notes behavioral requirements are unchanged; visual treatment changes are design-only -->

## Impact

- **Prisma schema**: New `VendorImage` model; `Vendor` gains `images` relation
- **Vercel Blob**: Images stored via existing blob infrastructure; new cleanup path on vendor delete
- **New API route**: `/api/blob/upload` already exists and is reused; new server action for website image fetching
- **tRPC vendor router**: New procedures — `saveImages`, `deleteImage`, `setCoverImage`, `fetchWebsiteImages`
- **vendor.repository.ts / vendor.service.ts**: Image CRUD, blob cleanup on cascade delete
- **VendorCard**: New cover thumbnail slot; typography and delete button changes
- **VendorDetailPanel**: Image gallery section at top; empty state; Scratchpad/Interaction Log visual rework; minor cleanup (footer button, price format, quotes count label)
- **upload-config.ts**: New `MAX_IMAGES_PER_VENDOR = 5` constant
- **No guest-facing impact**: Images are internal to the couple's planning view only
