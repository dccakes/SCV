# OSWP Blog Tag Taxonomy

This document defines the official tag set for the OSWP blog. All MDX posts
must use tags from this list. New tags require CMO sign-off before use.

---

## Core Tags

### `product`
What it covers: new features, UX improvements, and product milestones that
couples and developers will directly experience.
When to use: any post announcing or explaining a shipped feature. Pair with
feature-specific tags when relevant.
Example titles:
- "Etta can now draft your save-the-date messages"
- "Introducing multi-event RSVP tracking"

### `engineering`
What it covers: technical architecture decisions, domain-driven design
patterns, infrastructure choices, and developer experience improvements.
When to use: posts written primarily for contributors and technical readers.
Not for product announcement posts even if they contain technical details.
Example titles:
- "How we built OSWP's domain architecture"
- "Why we chose tRPC over REST for our API layer"

### `open-source`
What it covers: community milestones, contributor spotlights, governance
decisions, license updates, and anything that speaks to the open-source
nature of the project.
When to use: posts where the open-source angle is central, not incidental.
Can overlap with `engineering` or `community`.
Example titles:
- "OSWP is now accepting contributions"
- "How to self-host OSWP in 15 minutes"

### `community`
What it covers: contributor highlights, community growth milestones, Discord
updates, and show-and-tell posts from couples or developers using OSWP.
When to use: posts celebrating people, not features.
Example titles:
- "Meet the first 10 contributors to OSWP"
- "Community spotlight: how @someone used OSWP for their 200-person wedding"

### `changelog`
What it covers: release notes and version summaries. Serves the
`/blog?tag=changelog` route which replaces a standalone `/changelog` page.
When to use: every version release post. Use `changelog` as the primary tag;
add `product` or `engineering` if the release is feature-heavy or
architecture-significant.
Format rule: changelog posts should use version as the slug suffix, e.g.
`2026-04-06-release-0-3-0.mdx`.
Example titles:
- "OSWP v0.3.0 — Etta AI, member invites, and vendor files"
- "OSWP v0.2.0 — Domain architecture and new auth layer"

### `wedding-planning`
What it covers: advice, guides, and content for couples using OSWP to plan
their wedding. Educates couples on planning decisions, not on OSWP features.
When to use: content that would be useful even if the reader hadn't heard of
OSWP. SEO-heavy, top-of-funnel content.
Example titles:
- "How to build a wedding guest list that doesn't cause family drama"
- "The RSVP deadline: how early is too early?"

---

## Tag Usage Rules

1. Every post must have at least one tag.
2. Maximum three tags per post. Forcing more than three usually means the
   post is trying to cover too much ground.
3. `changelog` posts get `changelog` as their first tag.
4. `wedding-planning` posts should not also carry `engineering` — different
   audiences, different distribution channels.
5. If a post doesn't fit cleanly into any tag, it likely needs to be
   narrowed before publishing, not given a new tag.

---

## Distribution Notes by Tag

| Tag | Primary channel | SEO intent |
|-----|----------------|------------|
| `product` | Product Hunt, GitHub, Discord | Branded + feature keywords |
| `engineering` | HN, dev Twitter, GitHub | Technical long-tail |
| `open-source` | GitHub, HN, OSS communities | "self-host", "open source wedding" |
| `community` | Discord, Twitter, LinkedIn | Social proof |
| `changelog` | Email list, GitHub releases | Version keywords |
| `wedding-planning` | Pinterest, couples' forums, SEO | High-intent wedding keywords |
