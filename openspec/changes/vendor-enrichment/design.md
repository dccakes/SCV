## Context

The vendor domain currently tracks vendors with a fixed schema: status, contact info, quotes, and quote-level notes. Couples need to annotate vendors with free-form impressions, log interactions over time, flag outreach, and compare vendors on category-specific criteria. Etta also needs richer vendor awareness to assist couples more proactively.

The existing codebase has precedents for all three patterns being introduced: `HouseholdNote` for auditable note timelines, `EttaSuggestion.payload: Json` for flexible structured data, and manual `__mocks__` for the test layer.

## Goals / Non-Goals

**Goals:**
- Add `notes`, `contacted`, `customFields` fields to `Vendor` without breaking existing queries
- Introduce `VendorNote` table following the `HouseholdNote` pattern exactly
- Introduce `VendorCategoryConfig` with system defaults (seeded) and per-wedding override support
- Give Etta three new tools and update `get_vendor_list` to include the new fields
- Client-side status-priority sort and visual deactivation for bottom-group vendor cards

**Non-Goals:**
- Server-side sort changes (repository ordering stays `category asc, createdAt asc`)
- Custom field validation at the persistence layer (keys are not validated against definitions)
- Querying or filtering vendors by custom field values
- Etta creating or modifying `VendorCategoryConfig` directly
- Per-field access control on custom fields

## Decisions

### D1: VendorNote follows HouseholdNote exactly
**Decision:** Mirror the `HouseholdNote` model, index, and service pattern for `VendorNote`.  
**Why:** The pattern is already established, tested, and understood. Diverging adds cognitive overhead without benefit.  
**Alternative considered:** Simple `notes: String?` array — rejected because it loses attribution (who wrote it) and timestamp history.

### D2: VendorCategoryConfig uses a single Json column for field definitions
**Decision:** Store field definitions as `Json` (`[{key, label, type, displayOrder}]`) rather than a normalized `VendorCategoryField` table.  
**Why:** Custom fields are primarily for display and comparison, not queried at the DB level. JSON is simpler, schema changes don't require migrations, and the pattern is established (EttaSuggestion.payload, Notification.payload). The field count per category will be small (< 20).  
**Alternative considered:** Normalized table — rejected because it adds joins, migrations on field add/remove, and complexity not justified by the use case.

### D3: Per-wedding override is full replacement, not merge
**Decision:** A wedding-specific `VendorCategoryConfig` fully replaces the system default for that category.  
**Why:** Merging (wedding fields + system fields) creates ambiguity about ordering, duplicates, and deletions. Full replacement is predictable and easy to reason about. When a couple first customizes, they get a copy of the system default as a starting point.  
**Alternative considered:** Additive merge — rejected due to edge cases around removing system defaults the couple doesn't want.

### D4: customFields on Vendor stores values as a flat JSON object (not an array)
**Decision:** `customFields: Json?` stored as `{key: value}` where all values are strings.  
**Why:** Simple key lookups, easy merging in Etta's `update_vendor` (spread/assign semantics), and straightforward UI rendering. The display layer knows the type from the category config and interprets accordingly.  
**Alternative considered:** Array of `{key, value}` objects — rejected, adds unnecessary complexity for iteration and lookup.

### D5: Etta's update_vendor merges customFields rather than replacing
**Decision:** When Etta calls `update_vendor` with `customFields`, the new pairs are merged into the existing object (shallow merge), not a full replacement.  
**Why:** Etta typically sets one or two fields at a time (e.g., after reading a quote PDF). Requiring Etta to provide all existing fields to avoid data loss is brittle.  
**Trade-off:** A field cannot be removed by Etta (would require explicit null handling). Acceptable for now.

### D6: Client-side sort, not server-side
**Decision:** Status-priority sort is applied in `VendorCategorySection` before rendering.  
**Why:** SQL enum ordering is alphabetical, not semantic. Adding a computed sort key server-side would require schema changes or raw queries. The vendor list is already grouped client-side; adding a sort step is minimal overhead.  
**Trade-off:** If a category has hundreds of vendors, client sort is fine. Pagination would require revisiting.

### D7: SUGGEST_VENDOR_FIELD reuses existing EttaSuggestion system
**Decision:** Use `EttaSuggestion` with a new `action: 'SUGGEST_VENDOR_FIELD'` type and tier T2.  
**Why:** The suggestion/approval flow already exists and the couple already understands it. No new UI infrastructure needed.  
**On approval:** The suggestion handler creates/upserts a wedding-level `VendorCategoryConfig`, appending the new field and copying system defaults if no wedding config exists yet.

## Risks / Trade-offs

- **Schema drift in customFields** → Keys in `Vendor.customFields` may reference fields no longer in the category config (e.g., couple removed a field). Mitigation: UI ignores unknown keys gracefully; no hard constraint at DB level by design.
- **System default config changes don't propagate** → Once a wedding has an override, system default updates don't reach them. Mitigation: Acceptable for v1; a "reset to defaults" action can be added later.
- **VendorNote has no edit/delete** → Immutable log means mistakes persist. Mitigation: By design — couples can add a correction note. Consistent with HouseholdNote.
- **Etta merge semantics for customFields** → Fields set by Etta accumulate; stale values may linger if a key is renamed in the config. Mitigation: Low risk in practice; full reset available via couple-initiated update.

## Migration Plan

1. Add Prisma migration: new columns on `Vendor` (`notes`, `contacted`, `customFields`) with safe defaults (`contacted` defaults to `false`, others nullable)
2. Add Prisma migration: create `vendor_notes` and `vendor_category_configs` tables
3. Run seed to populate system-default `VendorCategoryConfig` rows for all 7 categories
4. Deploy — no backfill needed; new fields are nullable or have defaults
5. Rollback: migrations are additive; removing columns/tables is safe if no production data has been written to new fields

## Open Questions

- What are the specific system-default field definitions for each of the 7 categories? (To be decided at implementation time — seed author's judgment.)
- Should `update_vendor` require `vendor_quote` permission or a new `vendor` write permission? (Current assumption: reuse existing `vendor` write authz, consistent with status updates.)
