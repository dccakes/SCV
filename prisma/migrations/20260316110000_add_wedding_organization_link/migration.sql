-- Add optional Better Auth organization linkage for weddings
ALTER TABLE "Wedding"
ADD COLUMN "organizationId" TEXT;

CREATE UNIQUE INDEX "Wedding_organizationId_key"
ON "Wedding"("organizationId");
