-- Add Better Auth organization plugin tables to Prisma's migration history.
-- These tables mirror what `@better-auth/cli migrate` would create.
-- Using IF NOT EXISTS so this is safe on environments where they already exist.

CREATE TABLE IF NOT EXISTS "organization" (
    "id"        TEXT NOT NULL PRIMARY KEY,
    "name"      TEXT NOT NULL,
    "slug"      TEXT NOT NULL,
    "logo"      TEXT,
    "metadata"  TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "organization_slug_key" ON "organization"("slug");

CREATE TABLE IF NOT EXISTS "member" (
    "id"             TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId"         TEXT NOT NULL,
    "role"           TEXT NOT NULL,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "member_userId_fkey"         FOREIGN KEY ("userId")         REFERENCES "User"("id")         ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "member_organizationId_idx" ON "member"("organizationId");
CREATE INDEX IF NOT EXISTS "member_userId_idx"         ON "member"("userId");

CREATE TABLE IF NOT EXISTS "invitation" (
    "id"             TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "email"          TEXT NOT NULL,
    "role"           TEXT,
    "status"         TEXT NOT NULL DEFAULT 'pending',
    "expiresAt"      TIMESTAMP(3) NOT NULL,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "invitation_organizationId_idx" ON "invitation"("organizationId");
CREATE INDEX IF NOT EXISTS "invitation_email_idx"          ON "invitation"("email");
