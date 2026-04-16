-- Store structured guest dietary restrictions payload as JSON string
ALTER TABLE "Guest"
ADD COLUMN "dietaryRestrictions" TEXT;
