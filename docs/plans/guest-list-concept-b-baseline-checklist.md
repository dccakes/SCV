# Guest List Concept B Baseline Checklist

Date: 2026-04-24
Scope: PR1 baseline + guardrails for Concept B rollout

## Core Journeys

- [ ] Open `/guest-list`
- [ ] Locate a known household via search/filter
- [ ] Open guest detail drawer
- [ ] Edit contact/address and save
- [ ] Open Manage Members modal
- [ ] Open Add Guest form

## Visible Control Guardrails

- [ ] Search input visible (`Find guests`)
- [ ] RSVP filter visible (`Filter By`)
- [ ] Tag filter visible (`Guest Tag`)
- [ ] Country filter visible (`Country`)
- [ ] Sort buttons visible (`Sort by Name`, `Sort by Party Size`)
- [ ] View mode controls visible (`Card view`, `Table view`)
- [ ] Primary actions visible (`Import Guests`, `Add Guest`)

## Baseline Metrics Template

Record values from CI/local smoke runs (update per PR phase):

| Journey | Clicks | Median Time (ms) | P95 Time (ms) | Notes |
|---|---:|---:|---:|---|
| Open list page | TBD | TBD | TBD | |
| Find + open household drawer | TBD | TBD | TBD | |
| Edit + save contact/address | TBD | TBD | TBD | |
| Open members modal | TBD | TBD | TBD | |
| Open add guest form | TBD | TBD | TBD | |

## Regression Checks

- [ ] No silent close data loss in drawer workflows
- [ ] List controls remain visible in all tested breakpoints
- [ ] Card/table toggle remains reachable and functional
- [ ] Existing guest-list e2e suites still pass

