-- AlterTable
-- Add a short opaque invite code for the household save-the-date / invite
-- link, replacing the long signed-token URL. Nullable and unique so existing
-- households get one assigned the next time their invite link is generated.
ALTER TABLE "Household" ADD COLUMN "inviteCode" TEXT;
ALTER TABLE "Household" ADD COLUMN "inviteCodeExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Household_inviteCode_key" ON "Household"("inviteCode");
