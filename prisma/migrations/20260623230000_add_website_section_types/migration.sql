-- AlterEnum
-- Add the new wedding website section types. Existing rows are unaffected.
ALTER TYPE "WebsiteSectionType" ADD VALUE IF NOT EXISTS 'OUR_STORY';
ALTER TYPE "WebsiteSectionType" ADD VALUE IF NOT EXISTS 'WEDDING_PARTY';
ALTER TYPE "WebsiteSectionType" ADD VALUE IF NOT EXISTS 'TRAVEL';
ALTER TYPE "WebsiteSectionType" ADD VALUE IF NOT EXISTS 'FAQ';
ALTER TYPE "WebsiteSectionType" ADD VALUE IF NOT EXISTS 'REGISTRY';
