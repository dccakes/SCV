## ADDED Requirements

### Requirement: Website image discovery inspects likely media pages
When a vendor has a website URL, the system SHALL inspect the submitted page and up to 3 additional same-origin pages that are highly likely to contain vendor photos.

#### Scenario: Gallery page is found from homepage navigation
- **WHEN** the submitted vendor website homepage links to a same-origin page whose URL or link text indicates a gallery or photo page
- **THEN** image discovery includes that page when collecting candidate image URLs

#### Scenario: Gallery page is found from sitemap
- **WHEN** `/sitemap.xml` is available and contains same-origin URLs whose paths indicate gallery, photo, wedding, event, venue, room, or similar media pages
- **THEN** image discovery scores those URLs and includes the highest-ranking pages within the configured page limit

#### Scenario: Discovery remains bounded
- **WHEN** a website contains many navigation links or sitemap URLs
- **THEN** the system fetches only the submitted page, optional sitemap, and up to 3 highest-ranking same-origin media pages

#### Scenario: Secondary page failure is non-fatal
- **WHEN** one or more selected secondary pages fail to load or time out
- **THEN** image discovery still returns candidates found on successfully fetched pages

---

### Requirement: Media page scoring supports multilingual and language-agnostic signals
The system SHALL score likely media pages using multilingual gallery/vendor terms and image-density signals rather than relying only on English route names.

#### Scenario: Spanish gallery route is recognized
- **WHEN** a same-origin candidate page uses Spanish gallery or wedding terms such as `galeria`, `galería`, `fotos`, `bodas`, `salon`, `salón`, `salones`, `banquetes`, or `habitaciones`
- **THEN** the system treats the page as a likely media page during discovery

#### Scenario: Accented and unaccented terms match
- **WHEN** candidate URL paths or link text contain accented terms such as `galería` or `salón`
- **THEN** the system matches them equivalently to unaccented terms such as `galeria` or `salon`

#### Scenario: Image-heavy page can rank without known language terms
- **WHEN** a same-origin candidate page does not contain recognized media keywords but exposes many image-file references
- **THEN** the system can rank it as a likely media page based on image density

---

### Requirement: Image extraction includes gallery plugin patterns
The system SHALL extract candidate image URLs from common static gallery patterns, not only social metadata and dimensioned `<img>` tags.

#### Scenario: Direct image links are extracted
- **WHEN** a fetched page contains anchor links to image files such as `.jpg`, `.jpeg`, `.png`, or `.webp`
- **THEN** those image URLs are included as candidates after URL resolution and filtering

#### Scenario: Lazy-loaded images are extracted
- **WHEN** a fetched page contains image URLs in lazy-load attributes such as `data-src`, `data-lazy-src`, or `data-original`
- **THEN** those image URLs are included as candidates after URL resolution and filtering

#### Scenario: Srcset images are extracted
- **WHEN** a fetched page contains `srcset` entries
- **THEN** the system extracts image URLs from the `srcset` values and includes usable candidates

#### Scenario: Background images are extracted
- **WHEN** a fetched page contains CSS background image URLs
- **THEN** those image URLs are included as candidates after URL resolution and filtering

#### Scenario: Low-value assets are filtered
- **WHEN** extracted URLs point to obvious low-value assets such as SVGs, favicons, logos, icons, QR codes, tracking pixels, scripts, stylesheets, PDFs, or videos
- **THEN** the system excludes those URLs from the candidate results

---

### Requirement: Candidate images are ranked by likely usefulness
The system SHALL return candidate image URLs ordered by likely usefulness for the vendor image picker.

#### Scenario: Gallery page images outrank social preview images
- **WHEN** discovery finds both gallery/media page images and homepage `og:image` or `twitter:image` URLs
- **THEN** gallery/media page images appear before social preview image URLs in the returned list

#### Scenario: Duplicate images are returned once
- **WHEN** the same absolute image URL is found from multiple pages or extraction sources
- **THEN** the returned candidate list contains that image URL only once

#### Scenario: Candidate list remains capped
- **WHEN** discovery finds more than 20 usable candidate image URLs
- **THEN** the system returns at most 20 URLs after ranking and deduplication

#### Scenario: Empty discovery is graceful
- **WHEN** no usable image URLs are found across the submitted page and selected media pages
- **THEN** the system returns an empty array without throwing an error to the user
