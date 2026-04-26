## Why

Couples need richer vendor tracking: a place to jot impressions, log interactions over time, flag whether they've reached out, and compare vendors on category-specific criteria (e.g., max guest capacity for venues, shooting style for photographers). The current model only supports status and quote-level notes, leaving no room for this context. Additionally, the vendor list gives no visual hierarchy — a selected venue and a declined one look equally prominent.

## What Changes

- Add `notes`, `contacted`, and `customFields` fields to the `Vendor` model
- Add `VendorNote` table for a timestamped interaction log per vendor (couple and Etta can both add entries)
- Add `VendorCategoryConfig` table to define custom field schemas per category, with system-wide defaults and per-wedding overrides
- Seed system-default field definitions for all 7 vendor categories
- Extend Etta with tools to read category configs, update vendor-level data, and add interaction notes; Etta can suggest new category fields (via EttaSuggestion T2) but cannot create them directly
- Client-side sort within each category: active vendors by status priority (SELECTED → IN_REVIEW), bottom group (NOT_AVAILABLE, DECLINED) by `updatedAt` descending
- Visual deactivation treatment on DECLINED and NOT_AVAILABLE vendor cards

## Capabilities

### New Capabilities

- `vendor-notes`: Per-vendor scratchpad (`notes` field) and timestamped interaction log (`VendorNote` table), writable by both the couple and Etta
- `vendor-contact-status`: Boolean `contacted` flag on each vendor indicating outreach has been made
- `vendor-custom-fields`: Category-scoped custom field definitions (`VendorCategoryConfig`) with system defaults and per-wedding overrides; values stored as JSON on the vendor record; field types: text, number, boolean
- `vendor-display-ordering`: Client-side status-priority sort within each category section, with visual deactivation for declined/unavailable vendors
- `etta-vendor-tools`: Three new Etta tools (`get_category_config`, `update_vendor`, `add_vendor_note`) and updates to `get_vendor_list`; field suggestion via EttaSuggestion

### Modified Capabilities

<!-- No existing specs to delta against -->

## Impact

- **Prisma schema**: 3 new fields on `Vendor`, 2 new models (`VendorNote`, `VendorCategoryConfig`)
- **Database migration**: New tables, new columns with safe defaults
- **Seed data**: System-default `VendorCategoryConfig` rows for all 7 categories
- **Vendor domain**: repository, service, router, types, validator all extended
- **Etta tools**: `src/lib/etta/tools/vendors.ts` — 3 new tools, `get_vendor_list` updated
- **EttaSuggestion**: New action type `SUGGEST_VENDOR_FIELD`
- **UI components**: `vendor-category-section.tsx` (sort), `vendor-card.tsx` (visual treatment), new components for notes, interaction log, custom fields, category config management
