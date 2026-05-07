## Why

Couples can currently track vendor records and quotes, but they cannot quickly capture and compare subjective preferences across vendors. Adding lightweight star ratings now creates a simple decision aid that improves vendor comparison immediately and enables richer ranking and recommendation experiences later.

## What Changes

- Add per-user vendor star ratings with nullable values and a constrained 1-5 range.
- Show an average vendor rating computed from submitted user ratings only.
- Display a user-level rating breakdown in contextual UI (hover on desktop; equivalent detail affordance for non-hover interactions).
- Keep rating capture generic across all vendor categories (not venue-specific).

## Capabilities

### New Capabilities
- `vendor-star-ratings`: Capture per-user vendor star ratings and surface aggregate and per-user views for comparison.

### Modified Capabilities
None.

## Impact

- Affected systems: Vendor domain data model, vendor service/repository/router APIs, and vendor list/detail UI surfaces.
- Data model impact: Introduces a new relationship for user-specific ratings rather than fixed bride/groom columns.
- UX impact: Vendor cards/lists gain average rating display, with drill-in to participant-level ratings.
