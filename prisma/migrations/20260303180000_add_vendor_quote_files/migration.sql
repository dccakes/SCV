-- CreateTable
CREATE TABLE "VendorQuoteFile" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorQuoteFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorQuoteFile_quoteId_idx" ON "VendorQuoteFile"("quoteId");

-- AddForeignKey
ALTER TABLE "VendorQuoteFile" ADD CONSTRAINT "VendorQuoteFile_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "VendorQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
