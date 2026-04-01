-- Sync Prisma schema with the activeOrganizationId column added by Better Auth's
-- own migration (`npx @better-auth/cli migrate`). The column may already exist;
-- this is a no-op if so.
ALTER TABLE "Session"
ADD COLUMN IF NOT EXISTS "activeOrganizationId" TEXT;
