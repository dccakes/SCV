## 1. Schema & Migration

- [x] 1.1 Add `notes String?`, `contacted Boolean @default(false)`, `customFields Json?` fields to the `Vendor` model in `prisma/schema.prisma`
- [x] 1.2 Add `VendorNote` model to `prisma/schema.prisma` (mirror `HouseholdNote`: id, vendorId, weddingId, message, actorType, createdAt, indexes)
- [x] 1.3 Add `VendorCategoryConfig` model to `prisma/schema.prisma` (id, weddingId nullable, category, fieldDefinitions Json, unique constraint on [weddingId, category])
- [x] 1.4 Run `npx prisma migrate dev --name vendor-enrichment` to generate and apply the migration
- [x] 1.5 Add system-default seed data in `prisma/seed.ts` — one `VendorCategoryConfig` row per category (weddingId null) with sensible field definitions for all 7 categories

## 2. Vendor Domain — Types & Validators

- [x] 2.1 Add `VendorNote` type and `VendorCategoryConfig` type (including `FieldDefinition` type) to `vendor.types.ts`
- [x] 2.2 Add `addVendorNoteSchema` Zod validator (message: non-empty string) to `vendor.validator.ts`
- [x] 2.3 Add `updateVendorSchema` Zod validator (`contacted?`, `notes?`, `customFields?`) to `vendor.validator.ts`
- [x] 2.4 Add `fieldDefinitionSchema` and `upsertCategoryConfigSchema` Zod validators to `vendor.validator.ts`

## 3. Vendor Domain — Repository

- [x] 3.1 Write tests for `VendorNoteRepository`: `create`, `findByVendorId` (ordered by createdAt desc)
- [x] 3.2 Implement `VendorNoteRepository` in `vendor.repository.ts` (or a new `vendor-note.repository.ts`)
- [x] 3.3 Write tests for `VendorCategoryConfigRepository`: `findByCategory` (wedding override → system default fallback), `upsert`
- [x] 3.4 Implement `VendorCategoryConfigRepository` with fallback logic (wedding-specific first, then weddingId null)
- [x] 3.5 Update `VendorRepository.findAllByWeddingId` to include `notes`, `contacted`, `customFields` in returned fields

## 4. Vendor Domain — Service

- [x] 4.1 Write tests for `addVendorNote`: happy path, authorization (vendor not owned), empty message rejection
- [x] 4.2 Implement `addVendorNote(weddingId, vendorId, message, actorType)` in `vendor.service.ts`
- [x] 4.3 Write tests for `updateVendor`: sets contacted, notes, customFields (merge semantics); authorization error
- [x] 4.4 Implement `updateVendor(weddingId, vendorId, data)` in `vendor.service.ts` — customFields uses shallow merge
- [x] 4.5 Write tests for `getCategoryConfig`: returns wedding override when present, falls back to system default
- [x] 4.6 Implement `getCategoryConfig(weddingId, category)` in `vendor.service.ts`
- [x] 4.7 Write tests for `upsertCategoryConfig`: creates wedding override from system default on first call, updates on subsequent calls
- [x] 4.8 Implement `upsertCategoryConfig(weddingId, category, fieldDefinitions)` in `vendor.service.ts`

## 5. Vendor Domain — Router

- [x] 5.1 Add `addNote` tRPC mutation (protectedProcedure, input: vendorId + message, delegates to service)
- [x] 5.2 Add `getNotes` tRPC query (protectedProcedure, input: vendorId, returns VendorNote[])
- [x] 5.3 Add `update` tRPC mutation for vendor-level fields (protectedProcedure, input: vendorId + updateVendorSchema)
- [x] 5.4 Add `getCategoryConfig` tRPC query (protectedProcedure, input: category)
- [x] 5.5 Add `upsertCategoryConfig` tRPC mutation (protectedProcedure, input: category + fieldDefinitions)

## 6. Etta Tools

- [x] 6.1 Update `get_vendor_list` tool in `src/lib/etta/tools/vendors.ts` to include `contacted`, `notes`, `customFields` in output
- [x] 6.2 Add `get_category_config` tool — calls `vendorService.getCategoryConfig`, returns field definitions array
- [x] 6.3 Add `update_vendor` tool — calls `vendorService.updateVendor` directly (no suggestion), requires planner authz
- [x] 6.4 Add `add_vendor_note` tool — calls `vendorService.addVendorNote` with `actorType: 'etta'`
- [x] 6.5 Add `SUGGEST_VENDOR_FIELD` handling to the EttaSuggestion action types (payload type: `{ category, key, label, type, reason }`)
- [x] 6.6 Implement suggestion approval handler for `SUGGEST_VENDOR_FIELD` — on approval, upserts wedding `VendorCategoryConfig` appending the new field (copying system default if no wedding config exists)

## 7. UI — Vendor Display Ordering & Visual Treatment

- [x] 7.1 Add `STATUS_SORT_ORDER` constant in `vendor-category-section.tsx` (SELECTED: 0 … DECLINED: 5)
- [x] 7.2 Implement client-side sort in `VendorCategorySection` — active group (0–3) by priority asc, bottom group (4–5) by `updatedAt` desc
- [x] 7.3 Add deactivated visual treatment to `VendorCard` for DECLINED and NOT_AVAILABLE (opacity-50 + grayscale or equivalent Tailwind classes)

## 8. UI — Vendor Notes & Interaction Log

- [x] 8.1 Add `notes` textarea field to `VendorDetailPanel` (below contact info, saves via `vendor.update` mutation)
- [x] 8.2 Create `VendorNoteTimeline` component — renders list of `VendorNote` entries with timestamp, actor badge (couple/Etta), and message
- [x] 8.3 Add note input (textarea + submit button) to `VendorDetailPanel` that calls `vendor.addNote` mutation
- [x] 8.4 Wire `VendorNoteTimeline` into `VendorDetailPanel`, fetching notes via `vendor.getNotes` query

## 9. UI — Contacted Toggle

- [x] 9.1 Add `contacted` toggle/checkbox to `VendorDetailPanel` (or `VendorCard`) that calls `vendor.update` mutation with `{ contacted: bool }`
- [x] 9.2 Display contacted status visually on `VendorCard` (e.g., small indicator icon when contacted is true)

## 10. UI — Custom Fields Display & Edit

- [x] 10.1 Create `VendorCustomFields` component — renders custom fields for a vendor given category config definitions and current values; handles text/number/boolean input types
- [x] 10.2 Wire `VendorCustomFields` into `VendorDetailPanel` — fetches category config via `vendor.getCategoryConfig`, saves via `vendor.update` with updated `customFields`
- [x] 10.3 Create `CategoryConfigEditor` component — lets couple view and edit their wedding's field definitions for a category (add field, reorder, remove, set label/type)
- [x] 10.4 Wire `CategoryConfigEditor` into vendor settings or a category section action (accessible from the vendor list UI)

## 11. Mock Updates & Test Cleanup

- [x] 11.1 Update `src/server/domains/vendor/__mocks__/vendor.repository.ts` to expose mock functions for new repository methods
- [x] 11.2 Update `src/server/infrastructure/database/__mocks__/client.ts` to expose mock functions for `vendorNote` and `vendorCategoryConfig` Prisma models
