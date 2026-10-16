-- Spanish overlays for couple-authored guest-site content
ALTER TABLE "WebsiteSection" ADD COLUMN "translations" JSONB;
ALTER TABLE "Event" ADD COLUMN "translations" JSONB;
ALTER TABLE "Question" ADD COLUMN "translations" JSONB;
ALTER TABLE "Option" ADD COLUMN "translations" JSONB;
