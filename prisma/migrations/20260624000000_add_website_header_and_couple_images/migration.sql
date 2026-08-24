-- Add a dedicated header/hero image and a gallery of couple photos to the
-- wedding website. Existing rows default to no header image and an empty
-- couple gallery.
ALTER TABLE "Website" ADD COLUMN "headerImageUrl" TEXT;
ALTER TABLE "Website" ADD COLUMN "coupleImageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
