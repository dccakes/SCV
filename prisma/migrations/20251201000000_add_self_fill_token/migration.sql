-- AlterTable: Add selfFillToken to Wedding
ALTER TABLE "Wedding" ADD COLUMN "selfFillToken" TEXT;

-- CreateIndex: Unique index on selfFillToken (NULL values excluded per PostgreSQL semantics)
CREATE UNIQUE INDEX "Wedding_selfFillToken_key" ON "Wedding"("selfFillToken");
