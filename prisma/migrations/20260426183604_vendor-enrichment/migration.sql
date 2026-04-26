-- AlterTable
ALTER TABLE "Vendor"
ADD COLUMN "notes" TEXT,
ADD COLUMN "contacted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "customFields" JSONB;

-- CreateTable
CREATE TABLE "vendor_notes" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "wedding_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actor_type" TEXT NOT NULL DEFAULT 'couple',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_category_configs" (
    "id" TEXT NOT NULL,
    "wedding_id" TEXT,
    "category" "VendorCategory" NOT NULL,
    "field_definitions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_category_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vendor_notes_vendor_id_created_at_idx" ON "vendor_notes"("vendor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "vendor_notes_wedding_id_idx" ON "vendor_notes"("wedding_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_category_configs_wedding_id_category_key" ON "vendor_category_configs"("wedding_id", "category");

-- CreateIndex
CREATE INDEX "vendor_category_configs_category_idx" ON "vendor_category_configs"("category");

-- CreateIndex
CREATE INDEX "vendor_category_configs_wedding_id_idx" ON "vendor_category_configs"("wedding_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_category_configs_system_default_category_key"
ON "vendor_category_configs"("category")
WHERE "wedding_id" IS NULL;

-- AddForeignKey
ALTER TABLE "vendor_notes"
ADD CONSTRAINT "vendor_notes_vendor_id_fkey"
FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_notes"
ADD CONSTRAINT "vendor_notes_wedding_id_fkey"
FOREIGN KEY ("wedding_id") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_category_configs"
ADD CONSTRAINT "vendor_category_configs_wedding_id_fkey"
FOREIGN KEY ("wedding_id") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
