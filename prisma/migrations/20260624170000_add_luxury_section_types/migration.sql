-- AlterEnum
-- Add the luxury editorial wedding website section types. Existing rows are unaffected.
ALTER TYPE "WebsiteSectionType" ADD VALUE IF NOT EXISTS 'TIMELINE';
ALTER TYPE "WebsiteSectionType" ADD VALUE IF NOT EXISTS 'DESTINATION';
ALTER TYPE "WebsiteSectionType" ADD VALUE IF NOT EXISTS 'EXPERIENCES';
