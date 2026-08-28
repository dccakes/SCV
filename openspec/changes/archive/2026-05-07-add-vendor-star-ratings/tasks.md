## 1. Data model and persistence

- [x] 1.1 Add a `VendorRating` persistence model keyed by `vendorId` and `userId` with star range validation (1-5) and uniqueness on `(vendorId, userId)`.
- [x] 1.2 Create and apply the Prisma migration for vendor ratings, including indexes needed for efficient vendor-level aggregation.
- [x] 1.3 Extend vendor repository methods to read aggregate rating and per-user rating breakdown for vendor list/detail queries.
- [x] 1.4 Add repository write support to upsert the current user's rating for a vendor.

## 2. Domain and API behavior

- [x] 2.1 Add/extend vendor domain types and validators for rating submission and rating read models (average + per-user entries).
- [x] 2.2 Implement service-layer authorization and business rules for rating create/update and unrated handling.
- [x] 2.3 Expose tRPC procedures for setting a user rating and retrieving rating-aware vendor data for authorized wedding members.
- [x] 2.4 Ensure average computation uses submitted ratings only and returns no average when no ratings exist.

## 3. UI and interaction updates

- [x] 3.1 Add star rating input to vendor surfaces where a user can rate a vendor, with clear unrated state.
- [x] 3.2 Display average rating on vendor cards/list rows only when at least one rating exists.
- [x] 3.3 Implement per-user rating breakdown reveal interaction (hover on desktop) and an equivalent touch-safe interaction for non-hover devices.
- [x] 3.4 Keep category behavior consistent so rating UI applies to all vendor categories, not just venues.

## 4. Verification and tests

- [x] 4.1 Add unit tests for service/repository rating behavior, including upsert, authorization, and unrated scenarios.
- [x] 4.2 Add API tests for rating mutation/query flows and average calculation semantics.
- [x] 4.3 Add/update component tests for average rendering and per-user breakdown visibility behavior.
- [x] 4.4 Run project verification commands relevant to touched areas and confirm all new/updated tests pass.
