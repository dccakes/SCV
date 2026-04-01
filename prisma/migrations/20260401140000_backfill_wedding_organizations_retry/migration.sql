-- Re-run organization backfill now that the Better Auth tables exist.
-- The earlier migration (20260401000000) ran before the organization/member tables
-- were created and exited silently. This migration runs after those tables exist.
-- All operations are idempotent (WHERE NOT EXISTS / UPDATE WHERE NULL guards).

DO $$
DECLARE
  w   RECORD;
  uw  RECORD;
  org_id TEXT;
BEGIN
  FOR w IN
    SELECT id, "groomFirstName", "brideFirstName"
    FROM "Wedding"
    WHERE "organizationId" IS NULL
    ORDER BY "createdAt" ASC
  LOOP
    -- Reuse deterministic slug if org was already created
    SELECT id INTO org_id
    FROM organization
    WHERE slug = 'wedding-' || w.id
    LIMIT 1;

    IF org_id IS NULL THEN
      org_id := gen_random_uuid()::TEXT;
      INSERT INTO organization (id, name, slug, "createdAt", "updatedAt")
      VALUES (
        org_id,
        w."groomFirstName" || ' & ' || w."brideFirstName",
        'wedding-' || w.id,
        NOW(),
        NOW()
      );
    END IF;

    UPDATE "Wedding"
    SET "organizationId" = org_id
    WHERE id = w.id;

    FOR uw IN
      SELECT "userId", role
      FROM "UserWedding"
      WHERE "weddingId" = w.id
    LOOP
      INSERT INTO member (id, "organizationId", "userId", role, "createdAt", "updatedAt")
      SELECT
        gen_random_uuid()::TEXT,
        org_id,
        uw."userId",
        uw.role,
        NOW(),
        NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM member
        WHERE "organizationId" = org_id AND "userId" = uw."userId"
      );
    END LOOP;

  END LOOP;
END $$;
