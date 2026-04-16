-- CreateTable: household_notes for manual communication log entries
CREATE TABLE "household_notes" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "wedding_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actor_type" TEXT NOT NULL DEFAULT 'couple',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "household_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "household_notes_household_id_created_at_idx" ON "household_notes"("household_id", "created_at" DESC);
CREATE INDEX "household_notes_wedding_id_idx" ON "household_notes"("wedding_id");

-- AddForeignKey
ALTER TABLE "household_notes" ADD CONSTRAINT "household_notes_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "household_notes" ADD CONSTRAINT "household_notes_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Add thankYouSentAt to Gift
ALTER TABLE "Gift" ADD COLUMN "thankYouSentAt" TIMESTAMP(3);
