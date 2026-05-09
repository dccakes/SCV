## Context

The active `vendor-images` change added server-side website image discovery, but the current scraper only inspects the submitted website page and prioritizes social preview metadata plus dimensioned inline images. In practice, venue and vendor websites often expose one generic homepage `og:image` while useful photos live on gallery, wedding, event, venue, or room pages.

The target behavior is still lightweight server-side discovery, not browser automation. A representative example is `https://hotelhaciendadecortes.com.mx/galeria`: the page is Spanish, and many useful images are direct `.jpg` / `.png` links inside gallery sections such as `Galería`, `BODAS`, `SALONES`, and `HABITACIONES`. Discovery must therefore combine multilingual route/link scoring with language-agnostic image-density heuristics.

## Goals / Non-Goals

**Goals:**
- Find more useful candidate images from vendor websites without requiring users to manually paste gallery URLs.
- Inspect the homepage plus a small number of highly likely same-origin media pages discovered from homepage links and `/sitemap.xml`.
- Support non-English sites through multilingual keyword scoring and language-agnostic image-density scoring.
- Prefer real gallery/media images over generic `og:image` / `twitter:image` candidates.
- Keep the existing `fetchWebsiteImages` contract: return a ranked array of candidate image URLs.

**Non-Goals:**
- Full-site crawling or recursive crawling.
- Headless browser rendering, click automation, or JavaScript execution.
- External/social image scraping from Instagram, Pinterest, Facebook, Google Places, or promotional subdomains.
- Image classification, face detection, cropping, or aesthetic ranking.
- UI changes beyond using the existing ordered candidate list in the picker.

## Decisions

### 1. Bounded page discovery, not full crawling

The scraper will fetch the submitted website URL, then derive candidate media pages from:
- same-origin links found on the homepage
- same-origin URLs found in `/sitemap.xml`, when available

It will score candidates and fetch only the top 2-3 pages in addition to the homepage. The fetch budget remains strict: short per-request timeouts, same-origin only, and failure of any secondary page does not fail the whole operation.

**Alternative considered:** Recursive crawling. Rejected because it is slower, harder to bound, more likely to hit irrelevant pages, and unnecessary for the common case where nav/sitemap exposes gallery or event pages directly.

### 2. Multilingual and semantic page scoring

Candidate page scoring will use normalized URL path and link text tokens. Strong signals include:
- English: `gallery`, `photos`, `photo`, `portfolio`, `weddings`, `wedding`, `events`, `event`, `venue`, `venues`, `spaces`, `rooms`
- Spanish: `galeria`, `galería`, `fotos`, `foto`, `bodas`, `boda`, `eventos`, `evento`, `salon`, `salón`, `salones`, `banquetes`, `habitaciones`

The scorer will normalize accents for matching, so `galería` and `galeria` are equivalent. It will also include an image-density boost for pages whose URL candidates or HTML contain many image-file references, so sites in other languages can still be discovered when their gallery page is image-heavy.

**Alternative considered:** Detect page language or maintain a large translation dictionary. Rejected for v1; a small vendor/gallery vocabulary plus image-density scoring is simpler and more robust.

### 3. Broader image extraction

Image extraction will include:
- direct image file links in `<a href="...">`
- `<img src>`
- `srcset` entries
- common lazy-load attributes: `data-src`, `data-lazy-src`, `data-original`
- CSS `background-image: url(...)`
- existing `og:image` and `twitter:image`

The extractor will resolve relative URLs against the source page, dedupe globally, and skip obvious low-value assets such as SVGs, favicons, logos, icons, QR codes, tracking pixels, scripts, CSS, PDFs, and videos.

**Alternative considered:** Keep requiring explicit width/height >= 400px. Rejected because many gallery plugins omit dimensions or expose images as direct links. Dimension checks remain useful when present, but missing dimensions should not discard otherwise high-confidence gallery images.

### 4. Ranked results with metadata internally

The public return value remains `string[]`, but internally candidates will carry source metadata:
- source page URL
- source page score
- extraction source (`direct-link`, `img`, `srcset`, `lazy`, `background`, `social`)
- optional width/height when present

Ranking will prefer:
1. direct/gallery images from high-scoring media pages
2. large or likely-content images from media pages
3. homepage content images
4. social preview images

`og:image` and `twitter:image` remain fallback candidates but no longer dominate when richer gallery images exist.

**Alternative considered:** Change the API to return scored objects. Rejected for this change because the picker only needs URLs and a stable API reduces UI churn.

## Risks / Trade-offs

**Extra network requests** -> Limit to homepage, optional sitemap, and top 2-3 candidate pages with timeouts and graceful partial results.

**Irrelevant images from image-heavy pages** -> Use exclusion filters, same-origin restriction, page scoring, and ranking rather than blindly returning every URL.

**Non-English coverage remains incomplete** -> Combine common multilingual vendor terms with image-density scoring so useful pages can still rank even when labels are not recognized.

**Remote sites block requests or return malformed HTML/XML** -> Treat as empty/partial discovery and keep manual upload as the fallback.

**Large sitemap files** -> Cap sitemap bytes/read length and candidate URL count before scoring.

## Migration Plan

No data migration is required. Deploy the scraper changes behind the existing `vendor.fetchWebsiteImages` procedure. Rollback is a code revert to the previous single-page extraction behavior.

## Open Questions

- Should the UI eventually show where each candidate came from (homepage vs gallery page)? Not in this change because the API remains `string[]`.
- Should there be an explicit "Deep search" button later? This design makes the default search smarter while staying bounded; a deeper browser-rendered search can be considered separately if needed.
