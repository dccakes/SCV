-- Better Auth organization invitations now require inviterId.
-- Add inviter linkage to keep Prisma schema and Better Auth adapter in sync.

ALTER TABLE "invitation"
ADD COLUMN IF NOT EXISTS "inviterId" TEXT;

UPDATE "invitation" AS i
SET "inviterId" = COALESCE(
  (
    SELECT m."userId"
    FROM "member" AS m
    WHERE m."organizationId" = i."organizationId"
    ORDER BY m."createdAt" ASC
    LIMIT 1
  ),
  (
    SELECT u."id"
    FROM "User" AS u
    ORDER BY u."createdAt" ASC
    LIMIT 1
  )
)
WHERE i."inviterId" IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "invitation" WHERE "inviterId" IS NULL) THEN
    RAISE EXCEPTION 'Unable to backfill invitation.inviterId for all existing rows';
  END IF;
END $$;

ALTER TABLE "invitation"
ALTER COLUMN "inviterId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'invitation_inviterId_fkey'
  ) THEN
    ALTER TABLE "invitation"
    ADD CONSTRAINT "invitation_inviterId_fkey"
      FOREIGN KEY ("inviterId") REFERENCES "User"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "invitation_inviterId_idx" ON "invitation"("inviterId");
