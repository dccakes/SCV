# Blog & Marketing Pages Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Launch a content-driven marketing surface with an MDX blog (`/blog`, `/blog/[slug]`), standalone marketing pages (`/pricing`, `/open-source`), updated nav/footer links, and crawlable SEO assets (`/sitemap.xml`, `/robots.txt`).

**Architecture:** Keep blog content file-based in `content/blog/*.mdx` and statically render pages in Next.js App Router with server utilities in `src/lib/blog`. Split reusable marketing sections out of the landing page so `/pricing` and `/open-source` reuse existing copy/design without drift. Centralize frontmatter parsing/validation, read-time calculation, and metadata fallback logic so sitemap, index, and post pages all share the same source of truth.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS (`@tailwindcss/typography`), `next-mdx-remote`, `gray-matter`, Jest + Testing Library.

---

## Scope Alignment (from OSW-62)

- Blog infrastructure: `/blog` and `/blog/[slug]` backed by `content/blog/*.mdx`
- Marketing pages: `/pricing` extracted from landing, plus `/open-source`
- Landing nav/footer updates in `src/components/home/non-authenticated-view.tsx`
- SEO: `src/app/sitemap.ts`, `src/app/robots.ts`, per-post OG metadata
- Changelog served via `/blog?tag=changelog` (no `/changelog` route)

## Approach Options (Brainstorming Output)

1. **Recommended: File-based blog utilities + static App Router pages**
- Pros: Lowest operational complexity, no database/CMS coupling, deterministic builds, clean SEO support.
- Cons: Content updates require Git workflow.

2. **Dynamic runtime MDX fetch (filesystem read on request)**
- Pros: Simpler initial code.
- Cons: Runtime filesystem work, weaker cacheability guarantees, harder to enforce frontmatter validation early.

3. **Headless CMS integration now**
- Pros: Non-technical authoring.
- Cons: High scope increase, infra/auth overhead, out-of-scope with current spec.

Decision: Option 1.

## File Structure Map

**Create**
- `content/blog/` (new content directory)
- `content/blog/.gitkeep`
- `src/lib/blog/types.ts`
- `src/lib/blog/posts.ts`
- `src/lib/blog/mdx-components.tsx`
- `src/components/marketing/pricing-section.tsx`
- `src/components/marketing/open-source-section.tsx`
- `src/components/marketing/blog/tag-pill.tsx`
- `src/components/marketing/blog/post-card.tsx`
- `src/app/blog/page.tsx`
- `src/app/blog/[slug]/page.tsx`
- `src/app/open-source/page.tsx`
- `src/app/pricing/page.tsx`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `tests/unit/lib/blog/posts.test.ts`
- `tests/unit/app/blog.page.test.tsx`
- `tests/unit/app/blog-slug.page.test.tsx`
- `tests/unit/app/sitemap.test.ts`
- `tests/unit/app/robots.test.ts`

**Modify**
- `package.json`
- `tailwind.config.ts`
- `src/components/home/non-authenticated-view.tsx`
- `tests/unit/app/non-authenticated-view-mobile-nav.test.tsx`

---

## Chunk 1: Dependencies + Shared Blog Utilities

### Task 1: Install and wire blog dependencies

**Files:**
- Modify: `package.json`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Add runtime dependencies**
Run: `npm install next-mdx-remote gray-matter`
Expected: dependencies added without lockfile conflicts.

- [ ] **Step 2: Enable typography plugin**
Add `@tailwindcss/typography` to `plugins` in `tailwind.config.ts` next to `tailwindcss-animate`.

- [ ] **Step 3: Verify install/build health**
Run: `npm run test:unit -- --runInBand tests/unit/example.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**
```bash
git add package.json package-lock.json tailwind.config.ts
git commit -m "chore(marketing): add mdx blog dependencies and typography plugin"
```

### Task 2: Build typed blog content loader and metadata helpers

**Files:**
- Create: `src/lib/blog/types.ts`
- Create: `src/lib/blog/posts.ts`
- Create: `src/lib/blog/mdx-components.tsx`
- Create: `content/blog/.gitkeep`
- Test: `tests/unit/lib/blog/posts.test.ts`

- [ ] **Step 1: Write failing tests for parsing/filtering/sorting**
Cover:
- required frontmatter fields + optional image fields
- draft exclusion from published list
- newest-first ordering by `publishedAt`
- read time calculation from words
- tag filter behavior (`changelog`, etc.)
- OG image fallback (`ogImage -> coverImage -> /og-default.jpg`)

- [ ] **Step 2: Run targeted tests to confirm failure**
Run: `npm run test:unit -- --runInBand tests/unit/lib/blog/posts.test.ts`
Expected: FAIL for missing module/functions.

- [ ] **Step 3: Implement minimal utility layer**
Implement in `src/lib/blog/posts.ts`:
- content directory reader for `content/blog/*.mdx`
- frontmatter parsing via `gray-matter`
- typed normalization and date/read-time formatting helpers
- `getAllPublishedPosts`, `getPostBySlug`, `getAllPublishedSlugs`, `getAllTags`
- safe fallback behavior for malformed files (throw with filename context)

Implement component map in `src/lib/blog/mdx-components.tsx`:
- default mappings for anchors/code/paragraph
- `img` mapped to Next `<Image>` with conservative fallback (launch-safe behavior)

- [ ] **Step 4: Re-run tests**
Run: `npm run test:unit -- --runInBand tests/unit/lib/blog/posts.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add content/blog/.gitkeep src/lib/blog tests/unit/lib/blog/posts.test.ts
git commit -m "feat(blog): add typed mdx content loader and metadata helpers"
```

---

## Chunk 2: Blog Routes + Metadata + Tag Filtering

### Task 3: Implement `/blog` index page

**Files:**
- Create: `src/components/marketing/blog/tag-pill.tsx`
- Create: `src/components/marketing/blog/post-card.tsx`
- Create: `src/app/blog/page.tsx`
- Test: `tests/unit/app/blog.page.test.tsx`

- [ ] **Step 1: Write failing route test**
Assertions:
- renders heading + post card list
- filters by `searchParams.tag`
- includes changelog tag route behavior
- displays formatted date + read-time label

- [ ] **Step 2: Confirm failure**
Run: `npm run test:unit -- --runInBand tests/unit/app/blog.page.test.tsx`
Expected: FAIL due to missing page/component.

- [ ] **Step 3: Implement blog index page**
Use `getAllPublishedPosts()` + `getAllTags()` from `src/lib/blog/posts.ts`.
Render tag pills and card grid with empty-state copy for filtered/no-result cases.

- [ ] **Step 4: Re-run test**
Run: `npm run test:unit -- --runInBand tests/unit/app/blog.page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/app/blog/page.tsx src/components/marketing/blog tests/unit/app/blog.page.test.tsx
git commit -m "feat(blog): add blog index page with tag filtering"
```

### Task 4: Implement `/blog/[slug]` post page with per-post SEO

**Files:**
- Create: `src/app/blog/[slug]/page.tsx`
- Test: `tests/unit/app/blog-slug.page.test.tsx`

- [ ] **Step 1: Write failing post-route test**
Assertions:
- `generateStaticParams` excludes draft posts
- missing slug returns `notFound()`
- metadata includes title/description/OG/twitter
- OG image uses fallback chain

- [ ] **Step 2: Confirm failure**
Run: `npm run test:unit -- --runInBand tests/unit/app/blog-slug.page.test.tsx`
Expected: FAIL due to missing route/export.

- [ ] **Step 3: Implement post route**
Implement `generateStaticParams`, `generateMetadata`, and default page render:
- header fields (tag/title/description/author/date/read-time)
- optional hero image
- MDX body via `next-mdx-remote/rsc`
- post footer CTA to `/auth/signin`

- [ ] **Step 4: Re-run test**
Run: `npm run test:unit -- --runInBand tests/unit/app/blog-slug.page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/app/blog/[slug]/page.tsx tests/unit/app/blog-slug.page.test.tsx
git commit -m "feat(blog): add statically generated blog post route with metadata"
```

---

## Chunk 3: Marketing Page Extraction + Landing Link Updates

### Task 5: Extract and reuse pricing section for `/pricing`

**Files:**
- Create: `src/components/marketing/pricing-section.tsx`
- Create: `src/app/pricing/page.tsx`
- Modify: `src/components/home/non-authenticated-view.tsx`

- [ ] **Step 1: Extract pricing JSX into reusable component**
Move current pricing section (cards + pricing copy + CTA links) into `pricing-section.tsx` with optional `sectionId` prop so landing still uses `id='pricing'`.

- [ ] **Step 2: Create standalone pricing page**
Implement `src/app/pricing/page.tsx` to render page-level metadata + `PricingSection` without anchor-only semantics.

- [ ] **Step 3: Verify landing regression safety**
Run: `npm run test:unit -- --runInBand tests/unit/app/non-authenticated-view-mobile-nav.test.tsx`
Expected: PASS (or update in Task 7 if needed).

- [ ] **Step 4: Commit**
```bash
git add src/components/marketing/pricing-section.tsx src/app/pricing/page.tsx src/components/home/non-authenticated-view.tsx
git commit -m "refactor(marketing): extract pricing section and add pricing route"
```

### Task 6: Add `/open-source` page and reusable open-source section

**Files:**
- Create: `src/components/marketing/open-source-section.tsx`
- Create: `src/app/open-source/page.tsx`
- Modify: `src/components/home/non-authenticated-view.tsx`

- [ ] **Step 1: Extract OSS band into reusable component**
Preserve current tone/CTA; add optional richer long-form slot used by `/open-source`.

- [ ] **Step 2: Build `/open-source` route**
Add metadata and content blocks linking to:
- `https://github.com/dccakes/SCV`
- `https://github.com/dccakes/SCV/blob/main/CONTRIBUTING.md`
- self-hosting/docs anchor in repo docs

- [ ] **Step 3: Validate rendering path**
Run: `npm run test:unit -- --runInBand tests/unit/app/design-system.page.test.tsx`
Expected: PASS (sanity check no global breakage); add focused page test if needed.

- [ ] **Step 4: Commit**
```bash
git add src/components/marketing/open-source-section.tsx src/app/open-source/page.tsx src/components/home/non-authenticated-view.tsx
git commit -m "feat(marketing): add open-source page and shared section component"
```

### Task 7: Update nav + footer links for consumer-facing routes

**Files:**
- Modify: `src/components/home/non-authenticated-view.tsx`
- Modify: `tests/unit/app/non-authenticated-view-mobile-nav.test.tsx`

- [ ] **Step 1: Write failing nav/footer assertions**
Update test expectations:
- include `Blog`
- keep `Pricing`
- remove `Architecture`
- footer includes `Blog` and `Changelog` pointing to `/blog?tag=changelog`

- [ ] **Step 2: Confirm failure**
Run: `npm run test:unit -- --runInBand tests/unit/app/non-authenticated-view-mobile-nav.test.tsx`
Expected: FAIL on outdated labels/links.

- [ ] **Step 3: Implement nav/footer updates**
Set nav sequence to:
`Features | Etta AI | Blog | Pricing | GitHub ↗`
Update footer:
- `Blog -> /blog`
- `Changelog -> /blog?tag=changelog`
- keep Docs/GitHub/Discord external links.

- [ ] **Step 4: Re-run test**
Run: `npm run test:unit -- --runInBand tests/unit/app/non-authenticated-view-mobile-nav.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/components/home/non-authenticated-view.tsx tests/unit/app/non-authenticated-view-mobile-nav.test.tsx
git commit -m "feat(marketing): update landing nav and footer blog/changelog links"
```

---

## Chunk 4: SEO Infrastructure + Final Verification

### Task 8: Add sitemap and robots routes

**Files:**
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`
- Test: `tests/unit/app/sitemap.test.ts`
- Test: `tests/unit/app/robots.test.ts`

- [ ] **Step 1: Write failing tests for SEO routes**
Assertions:
- sitemap includes `/`, `/blog`, `/pricing`, `/open-source`
- sitemap includes all non-draft blog slugs
- robots points to `${NEXT_PUBLIC_APP_URL}/sitemap.xml`

- [ ] **Step 2: Confirm failure**
Run: `npm run test:unit -- --runInBand tests/unit/app/sitemap.test.ts tests/unit/app/robots.test.ts`
Expected: FAIL due to missing route files.

- [ ] **Step 3: Implement SEO route handlers**
Use `MetadataRoute.Sitemap` + `MetadataRoute.Robots` and reuse blog utility methods for dynamic blog URLs.

- [ ] **Step 4: Re-run tests**
Run: `npm run test:unit -- --runInBand tests/unit/app/sitemap.test.ts tests/unit/app/robots.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/app/sitemap.ts src/app/robots.ts tests/unit/app/sitemap.test.ts tests/unit/app/robots.test.ts
git commit -m "feat(seo): add sitemap and robots routes for marketing pages"
```

### Task 9: End-to-end quality gate for the feature branch

**Files:**
- Verify only (no new files)

- [ ] **Step 1: Run focused unit test suite**
Run:
```bash
npm run test:unit -- --runInBand \
  tests/unit/lib/blog/posts.test.ts \
  tests/unit/app/blog.page.test.tsx \
  tests/unit/app/blog-slug.page.test.tsx \
  tests/unit/app/non-authenticated-view-mobile-nav.test.tsx \
  tests/unit/app/sitemap.test.ts \
  tests/unit/app/robots.test.ts
```
Expected: PASS.

- [ ] **Step 2: Run lint + build check**
Run: `npm run check && npm run build:ci`
Expected: PASS with no type/build regressions.

- [ ] **Step 3: Manual smoke checklist**
- `/blog` renders cards and tag filters
- `/blog?tag=changelog` filters correctly
- `/blog/<slug>` metadata includes OG + twitter image
- `/pricing` and `/open-source` render independently
- landing nav/footer links resolve as expected
- `/sitemap.xml` and `/robots.txt` include expected entries

- [ ] **Step 4: Prepare PR**
Use a feature branch and open PR; do not merge directly into `main`.

---

## Risks and Mitigations

- **MDX image dimensions in body content**: authors may omit dimensions.
Mitigation: launch-safe fallback mapping and document authoring convention; tighten validation in follow-up issue.

- **Frontmatter drift over time**: inconsistent tags/metadata can hurt SEO.
Mitigation: strict parser validation + unit tests for taxonomy and required fields.

- **Landing page extraction regressions**: refactoring sections can break spacing/anchor behavior.
Mitigation: keep extracted components props minimal and verify anchor behavior + nav tests.

## Product/Approval Flags

- Head of Product signoff required before shipping nav label change (`Architecture` removal).
- CMO owns launch post content and taxonomy stewardship.

