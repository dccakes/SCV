-- CreateEnum
CREATE TYPE "NameDisplayOrder" AS ENUM ('GROOM_FIRST', 'BRIDE_FIRST');

-- AlterTable
ALTER TABLE "Wedding" ADD COLUMN "nameDisplayOrder" "NameDisplayOrder" NOT NULL DEFAULT 'GROOM_FIRST';
