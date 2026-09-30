-- WhatsApp guest messaging: per-wedding sender numbers + household-linked identities.

-- CreateTable
-- Pool of platform-owned WhatsApp numbers; a wedding claims one so attendees
-- can text the wedding directly and the webhook resolves the wedding by the
-- number that received the message.
CREATE TABLE "whatsapp_numbers" (
    "id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "wedding_id" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'twilio',
    "status" TEXT NOT NULL DEFAULT 'available',
    "assigned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_numbers_phone_number_key" ON "whatsapp_numbers"("phone_number");
CREATE UNIQUE INDEX "whatsapp_numbers_wedding_id_key" ON "whatsapp_numbers"("wedding_id");

-- AddForeignKey
ALTER TABLE "whatsapp_numbers" ADD CONSTRAINT "whatsapp_numbers_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "Wedding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
-- WhatsApp identities are scoped by the wedding's sender number so the same
-- attendee phone can exist across weddings; telegram rows keep '' and stay
-- unique per chat id. linked_by_user_id becomes nullable because attendee
-- identities are created by inbound messages, not by a signed-in pairing.
ALTER TABLE "messaging_identities" ADD COLUMN "service_number" TEXT NOT NULL DEFAULT '';
ALTER TABLE "messaging_identities" ADD COLUMN "household_id" TEXT;
ALTER TABLE "messaging_identities" ADD COLUMN "guest_id" INTEGER;
ALTER TABLE "messaging_identities" ALTER COLUMN "linked_by_user_id" DROP NOT NULL;

-- DropIndex
DROP INDEX "messaging_identities_channel_external_chat_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "messaging_identities_channel_service_number_external_chat_i_key" ON "messaging_identities"("channel", "service_number", "external_chat_id");
CREATE INDEX "messaging_identities_household_id_idx" ON "messaging_identities"("household_id");

-- AddForeignKey
ALTER TABLE "messaging_identities" ADD CONSTRAINT "messaging_identities_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messaging_identities" ADD CONSTRAINT "messaging_identities_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
