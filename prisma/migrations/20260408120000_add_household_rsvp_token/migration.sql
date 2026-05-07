-- AlterTable
ALTER TABLE "Household" ADD COLUMN "rsvpToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Household_rsvpToken_key" ON "Household"("rsvpToken");

-- CreateIndex
CREATE INDEX "Household_rsvpToken_idx" ON "Household"("rsvpToken");
