-- AddIndex: composite index for self-fill token expiry lookups
-- Covers the WHERE clause in validTokenWhere():
--   selfFillToken = ? AND (selfFillTokenGeneratedAt IS NULL OR selfFillTokenGeneratedAt >= ?)
-- Although selfFillToken is already UNIQUE, the composite index allows Postgres to
-- satisfy both the equality and the range/null conditions in a single index-only scan.
CREATE INDEX "Wedding_selfFillToken_generatedAt_idx" ON "Wedding"("selfFillToken", "selfFillTokenGeneratedAt");
