-- CreateEnum
CREATE TYPE "VendorCategory" AS ENUM (
    'VENUE',
    'CATERING',
    'PHOTOGRAPHER',
    'VIDEOGRAPHER',
    'MUSIC',
    'FLOWERS',
    'OTHER'
);

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM (
    'NOT_AVAILABLE',
    'DECLINED',
    'IN_REVIEW',
    'PRE_SELECTED',
    'IN_NEGOTIATION',
    'SELECTED'
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "category" "VendorCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "status" "VendorStatus" NOT NULL DEFAULT 'IN_REVIEW',
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorQuote" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "quoteDate" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorQuote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vendor_weddingId_idx" ON "Vendor"("weddingId");

-- CreateIndex
CREATE INDEX "Vendor_weddingId_category_idx" ON "Vendor"("weddingId", "category");

-- CreateIndex
CREATE INDEX "Vendor_weddingId_category_createdAt_idx" ON "Vendor"("weddingId", "category", "createdAt");

-- CreateIndex
CREATE INDEX "VendorQuote_vendorId_idx" ON "VendorQuote"("vendorId");

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorQuote" ADD CONSTRAINT "VendorQuote_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
