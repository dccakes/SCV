-- CreateEnum
CREATE TYPE "GuestAgeGroup" AS ENUM ('INFANT', 'CHILD', 'TEEN', 'ADULT');

-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "ageGroup" "GuestAgeGroup" DEFAULT 'ADULT';

-- CreateTable
CREATE TABLE "GuestTag" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestTagAssignment" (
    "id" TEXT NOT NULL,
    "guestId" INTEGER NOT NULL,
    "guestTagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestTagAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuestTag_weddingId_idx" ON "GuestTag"("weddingId");

-- CreateIndex
CREATE UNIQUE INDEX "GuestTag_weddingId_name_key" ON "GuestTag"("weddingId", "name");

-- CreateIndex
CREATE INDEX "GuestTagAssignment_guestId_idx" ON "GuestTagAssignment"("guestId");

-- CreateIndex
CREATE INDEX "GuestTagAssignment_guestTagId_idx" ON "GuestTagAssignment"("guestTagId");

-- CreateIndex
CREATE UNIQUE INDEX "GuestTagAssignment_guestId_guestTagId_key" ON "GuestTagAssignment"("guestId", "guestTagId");

-- AddForeignKey
ALTER TABLE "GuestTag" ADD CONSTRAINT "GuestTag_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestTagAssignment" ADD CONSTRAINT "GuestTagAssignment_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestTagAssignment" ADD CONSTRAINT "GuestTagAssignment_guestTagId_fkey" FOREIGN KEY ("guestTagId") REFERENCES "GuestTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
