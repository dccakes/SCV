-- AlterTable: Add selfFillTokenGeneratedAt to Wedding for token expiry tracking
ALTER TABLE "Wedding" ADD COLUMN "selfFillTokenGeneratedAt" TIMESTAMP(3);
