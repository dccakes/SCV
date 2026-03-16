-- CreateEnum
CREATE TYPE "QuoteType" AS ENUM ('FLAT_FEE', 'PER_GUEST');

-- AlterTable
ALTER TABLE "VendorQuote" ADD COLUMN "quoteType" "QuoteType" NOT NULL DEFAULT 'FLAT_FEE';
