-- AlterEnum
-- Add the standalone-surface section types (editable Save the Date / Invitation
-- copy). Existing rows are unaffected.
ALTER TYPE "WebsiteSectionType" ADD VALUE IF NOT EXISTS 'SAVE_THE_DATE';
ALTER TYPE "WebsiteSectionType" ADD VALUE IF NOT EXISTS 'INVITATION';
