-- AlterTable
ALTER TABLE "Guest" ADD COLUMN "isTagAlong" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "includeTagAlongsInHeadcount" BOOLEAN NOT NULL DEFAULT false;
