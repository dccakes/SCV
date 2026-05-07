## 1. Regression Tests

- [x] 1.1 Add unit test proving homepage navigation can discover and fetch a same-origin Spanish gallery page such as `/galeria`
- [x] 1.2 Add unit test proving `/sitemap.xml` can discover and rank media pages such as `/bodas`, `/galeria`, `/salon-*`, and `/bodas-y-banquetes`
- [x] 1.3 Add unit test proving direct image links from gallery pages are extracted and ranked ahead of homepage `og:image`
- [x] 1.4 Add unit tests for lazy-load attributes, `srcset`, background images, duplicate URLs, low-value asset filtering, and result cap behavior
- [x] 1.5 Add unit test proving secondary page fetch failures still return homepage or other successful page candidates

## 2. Discovery Model

- [x] 2.1 Introduce internal candidate page and candidate image metadata types in `src/server/infrastructure/scraper/website-images.ts`
- [x] 2.2 Add URL normalization helpers for same-origin filtering, relative URL resolution, accent-insensitive matching, and invalid URL handling
- [x] 2.3 Add capped fetch helper with shared timeout/user-agent behavior and graceful failure handling

## 3. Media Page Selection

- [x] 3.1 Extract same-origin navigation links from homepage HTML with link text and URL context
- [x] 3.2 Fetch and parse `/sitemap.xml` when available, capped by response size and candidate count
- [x] 3.3 Score candidate pages using multilingual media keywords and image-density signals
- [x] 3.4 Select the top 2-3 secondary pages, excluding the submitted page, external/social URLs, files, PDFs, videos, and low-confidence pages

## 4. Image Extraction and Ranking

- [x] 4.1 Extend extraction to include direct image links, `<img src>`, `srcset`, lazy-load attributes, and CSS background image URLs
- [x] 4.2 Preserve existing social metadata extraction but mark `og:image` and `twitter:image` as lower-priority sources
- [x] 4.3 Filter low-value assets such as SVGs, favicons, logos, icons, QR codes, tracking pixels, scripts, stylesheets, PDFs, and videos
- [x] 4.4 Rank image candidates using source page score, extraction source, dimensions when present, and homepage/social fallback priority
- [x] 4.5 Deduplicate absolute image URLs and return at most 20 ranked candidate URLs

## 5. Integration and Verification

- [x] 5.1 Keep `fetchWebsiteImages(url): Promise<string[]>` API-compatible with existing service/router/UI code
- [x] 5.2 Run focused scraper tests: `npm run test:unit -- tests/unit/infrastructure/scraper/website-images.test.ts`
- [x] 5.3 Run relevant vendor service tests that mock or call website image discovery
- [x] 5.4 Run `npm run lint` and `npm run build` or document any environment blockers
- [x] 5.5 Manually verify with `https://hotelhaciendadecortes.com.mx/galeria` or an equivalent fixture that gallery images rank before generic social preview images
