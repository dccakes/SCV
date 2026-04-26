-- Wedding website builder backend schema changes
-- Manual migration because `prisma migrate dev` was blocked by local DB access (P1010).

ALTER TABLE "Website"
  DROP COLUMN "url",
  ADD COLUMN "templateId" TEXT;

CREATE TYPE "WebsiteSectionType" AS ENUM ('HOME');

CREATE TABLE "WebsiteSection" (
  "id" TEXT NOT NULL,
  "websiteId" TEXT NOT NULL,
  "type" "WebsiteSectionType" NOT NULL,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "position" INTEGER NOT NULL,
  "content" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WebsiteSection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WebsiteSection_websiteId_type_key"
  ON "WebsiteSection"("websiteId", "type");

CREATE INDEX "WebsiteSection_websiteId_position_idx"
  ON "WebsiteSection"("websiteId", "position");

ALTER TABLE "WebsiteSection"
  ADD CONSTRAINT "WebsiteSection_websiteId_fkey"
  FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "WebsiteSection" (
  "id",
  "websiteId",
  "type",
  "isEnabled",
  "position",
  "content",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::TEXT,
  w."id",
  'HOME'::"WebsiteSectionType",
  true,
  0,
  '{"introText": ""}'::JSONB,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Website" w
LEFT JOIN "WebsiteSection" ws
  ON ws."websiteId" = w."id"
 AND ws."type" = 'HOME'::"WebsiteSectionType"
WHERE ws."id" IS NULL;

UPDATE "Wedding"
SET "enabledAddOns" = array_append("enabledAddOns", 'website_builder')
WHERE 'website' = ANY("enabledAddOns")
  AND NOT ('website_builder' = ANY("enabledAddOns"));
