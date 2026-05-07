## Context

The vendor domain currently supports vendor records, lifecycle statuses, and quote details, but there is no normalized way to capture subjective preference scores from planners. Product direction is to support ratings beyond a fixed bride/groom pair, so rating data must be modeled per user with nullable values and category-agnostic vendor applicability.

This change spans data modeling, vendor domain APIs, and vendor comparison UI. It also introduces aggregate presentation (average stars) with participant-level drill-in, which requires consistent read/write semantics across repository, service, and UI layers.

## Goals / Non-Goals

**Goals:**
- Support 1-5 star ratings per `(vendor, user)` pair with nullable unrated state.
- Compute and expose average rating from submitted ratings only.
- Display average rating in vendor list/card surfaces and show per-user breakdown in contextual detail UI.
- Keep the model generic for all vendor categories and future multi-user wedding configurations.

**Non-Goals:**
- Define a formal scoring rubric or weighted criteria model.
- Introduce historical rating versions or audit timelines.
- Build recommendation engines or ranking automation beyond average display.
- Redesign vendor notes behavior as part of this change.

## Decisions

1. **Use a dedicated `VendorRating` relation instead of columns on `Vendor`.**
   - Rationale: A relation scales naturally from two raters to many users and avoids schema churn when collaborators expand.
   - Alternative considered: `groomRating` / `brideRating` columns on `Vendor`; rejected because it hardcodes identities and blocks multi-user extension.

2. **Represent ratings as nullable integer values constrained to 1-5 when present.**
   - Rationale: Preserves explicit "not rated" and avoids conflating missing values with a low score.
   - Alternative considered: mandatory default rating (e.g., 0); rejected because it distorts averages and introduces false sentiment.

3. **Average is computed from non-null submitted ratings only.**
   - Rationale: Matches user intent that missing ratings are excluded rather than treated as zero.
   - Alternative considered: divide by all wedding members; rejected because it punishes partial participation.

4. **Expose two read models: aggregate average and per-user rating breakdown.**
   - Rationale: Supports fast scanning (average) and transparent decision context (who rated what) in one API contract.
   - Alternative considered: client-only aggregation from raw ratings; rejected to prevent duplicated logic and inconsistent formatting.

5. **Use progressive disclosure for per-user ratings.**
   - Rationale: Keep list density high while still allowing details via hover on desktop and equivalent non-hover affordance on touch.
   - Alternative considered: always show all user ratings inline; rejected due to visual clutter and poor scalability with many collaborators.

## Risks / Trade-offs

- **[Risk] Increased query complexity for vendor list retrieval** -> **Mitigation:** add repository-level includes/selects and indexes for `(vendorId, userId)` uniqueness and efficient aggregation.
- **[Risk] Ambiguity on mobile where hover does not exist** -> **Mitigation:** define and implement a touch-safe detail interaction (tap/popover or detail panel breakdown) during implementation tasks.
- **[Risk] Backfill behavior for existing vendors without ratings** -> **Mitigation:** treat absence of rating rows as unrated and ensure UI renders no rating state cleanly.
- **[Risk] Privacy expectations for per-user rating visibility** -> **Mitigation:** constrain rating read APIs to wedding members and use existing authorization boundaries in vendor service procedures.
