# Guest List Concept B Release Notes

Date: 2026-04-24
Branch: `dc/design-md-gaps`
Scope: Concept B implementation (selected mockup direction `...9f74`)

## Shipped in This Implementation Pass

### PR1: Baseline + Guardrails
- Added deterministic control-visibility tests for guest list controls.
- Added baseline checklist document:
  - `docs/plans/guest-list-concept-b-baseline-checklist.md`
- Added baseline timing annotation test for drawer open journey.

### PR2: Unified Controls + Mode + Filter State Clarity
- Added explicit workflow mode switch:
  - `Households`
  - `Person Audit`
- Added explicit sort-state indicator text.
- Reworked filter semantics:
  - `RSVP Status` label replaces ambiguous `Filter By`
  - Active filter chips (search, RSVP, tag, country) with per-chip clear
  - Deterministic filter reset on event context change

### PR3: List Presentation Refinements
- Refined person-audit table to include workflow-relevant columns:
  - Person
  - Household
  - Email
  - Tags
  - RSVP
  - Contact Complete
  - Location Complete
- Reduced household card visual density for cleaner scanning.

### PR4: Drawer Clarity + Unsaved State Visibility
- Increased section heading readability in guest detail drawer.
- Upgraded low-affordance text actions to clearer button-style affordances.
- Added visible `Unsaved changes` indicator in drawer header metadata.
- Strengthened destructive-action styling in members modal.

### PR5: Guest Form Close-Safety
- Added unsaved-close confirmation guard for guest form close action.
- Added isolated unit-tested close-confirmation rule helper:
  - `src/components/forms/guest-form.utils.ts`

## Validation Summary

Per PR gate checks completed:
- Targeted unit suites for changed areas
- `npx tsc --noEmit`
- Scoped Biome lint on modified files

Repository pre-commit hooks additionally ran full unit suite on each commit.

## Known Follow-Ups

- Playwright e2e execution in this workspace requires configured build assets (`.next/static`) for current webServer setup; e2e baseline metrics should be finalized in CI/staging run with full webServer boot path.
- Remaining Concept B enhancement opportunities (future increment):
  - richer preset chip behavior
  - explicit completeness filtering controls
  - deeper mobile-specific audit list ergonomics

