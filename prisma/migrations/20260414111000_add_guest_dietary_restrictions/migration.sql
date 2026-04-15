-- Store structured guest dietary restrictions payload as JSON string
ALTER TABLE "guest"
ADD COLUMN "dietaryRestrictions" TEXT;
