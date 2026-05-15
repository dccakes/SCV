## Why

The first website image discovery pass often returns only a single generic social preview image, which is not enough for couples comparing venues and vendors visually. Vendor sites frequently keep useful photos on gallery, wedding, event, or venue pages, including non-English pages such as Spanish `galeria` or `bodas` routes, so the discovery logic needs a bounded way to inspect likely media pages without becoming a full crawler.

## What Changes

- Improve website image discovery to inspect the homepage plus up to 2-3 highly likely same-origin media pages.
- Use `/sitemap.xml` and homepage navigation links to find likely pages, with multilingual path/link signals such as `gallery`, `galeria`, `galería`, `photos`, `fotos`, `portfolio`, `weddings`, `bodas`, `events`, `eventos`, `venue`, `salon`, and `salón`.
- Extract image candidates from more sources than social preview metadata, including direct image links, `srcset`, lazy-load attributes, and CSS background images.
- Rank candidates so gallery/media page images appear before generic `og:image` / `twitter:image` results.
- Keep discovery bounded: same-origin only, no social/external links, no full-site crawl, graceful empty result on failures.

## Capabilities

### New Capabilities

- `vendor-image-discovery`: Smart server-side discovery of candidate vendor images from vendor websites, including sitemap-assisted media page selection, multilingual gallery signals, broader extraction sources, and ranked results.

### Modified Capabilities

<!-- None. The related vendor-images change is still in progress and not archived as an existing capability. -->

## Impact

- `src/server/infrastructure/scraper/website-images.ts`: Add bounded page discovery, multilingual scoring, richer candidate extraction, and ranking.
- `tests/unit/infrastructure/scraper/website-images.test.ts`: Cover sitemap discovery, Spanish gallery routes, direct image links, ranking, dedupe, and failure modes.
- `src/server/domains/vendor/vendor.service.ts`: Existing `fetchWebsiteImages` service flow continues to call the scraper; no API contract change expected.
- tRPC/UI: Existing `vendor.fetchWebsiteImages` and `VendorImagePicker` continue receiving a candidate URL array; ordering becomes more useful.
- Network behavior: Additional same-origin fetches are introduced but capped by page count, timeout, and graceful failure handling.
