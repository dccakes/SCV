-- Add domain and execution metadata to Etta suggestions.

ALTER TABLE "etta_suggestions"
ADD COLUMN "domain" TEXT,
ADD COLUMN "executed_at" TIMESTAMP(3),
ADD COLUMN "failure_reason" TEXT;

UPDATE "etta_suggestions"
SET "domain" = 'other'
WHERE "domain" IS NULL;

ALTER TABLE "etta_suggestions"
ALTER COLUMN "domain" SET NOT NULL;

CREATE INDEX "etta_suggestions_wedding_id_domain_status_idx"
ON "etta_suggestions"("wedding_id", "domain", "status");
