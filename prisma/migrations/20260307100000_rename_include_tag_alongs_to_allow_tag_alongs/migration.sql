-- AlterTable: Rename includeTagAlongsInHeadcount to allowTagAlongs
ALTER TABLE "Event" RENAME COLUMN "includeTagAlongsInHeadcount" TO "allowTagAlongs";
