-- CreateTable
CREATE TABLE "VendorRating" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorRating_pkey" PRIMARY KEY ("id")
);

-- Constrain stars to integer values in 1..5 (nullable state is represented by absence of row)
ALTER TABLE "VendorRating"
    ADD CONSTRAINT "VendorRating_stars_range_chk" CHECK ("stars" BETWEEN 1 AND 5);

-- CreateIndex
CREATE UNIQUE INDEX "VendorRating_vendorId_userId_key" ON "VendorRating"("vendorId", "userId");

-- CreateIndex (efficient vendor-level aggregation)
CREATE INDEX "VendorRating_vendorId_idx" ON "VendorRating"("vendorId");

-- CreateIndex (efficient lookup of a user's submitted ratings)
CREATE INDEX "VendorRating_userId_idx" ON "VendorRating"("userId");

-- AddForeignKey
ALTER TABLE "VendorRating" ADD CONSTRAINT "VendorRating_vendorId_fkey"
    FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRating" ADD CONSTRAINT "VendorRating_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
