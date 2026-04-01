-- Backfill: create a Better Auth organization + member row for every existing
-- wedding that does not yet have one, and link Wedding.organizationId.
--
-- Guard: if the Better Auth tables don't exist yet (i.e. `npx @better-auth/cli
-- migrate` hasn't been run), the block exits silently. Re-running after the
-- Better Auth migration completes will pick up the remaining rows.

DO $$
DECLARE
  org_table_exists BOOLEAN;
  member_table_exists BOOLEAN;
  w RECORD;
  uw RECORD;
  org_id TEXT;
BEGIN
  -- Check both Better Auth tables exist before touching anything
  SELECT to_regclass('public.organization') IS NOT NULL INTO org_table_exists;
  SELECT to_regclass('public.member')       IS NOT NULL INTO member_table_exists;

  IF NOT org_table_exists OR NOT member_table_exists THEN
    RAISE NOTICE 'Better Auth tables not found — skipping organization backfill. Run `npx @better-auth/cli migrate` then re-run this migration.';
    RETURN;
  END IF;

  -- Iterate over weddings that have no org link yet
  FOR w IN
    SELECT id, "groomFirstName", "brideFirstName"
    FROM "Wedding"
    WHERE "organizationId" IS NULL
    ORDER BY "createdAt" ASC
  LOOP
    -- Idempotent: reuse an org with the deterministic slug if one already exists
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

    -- Link the wedding
    UPDATE "Wedding"
    SET "organizationId" = org_id
    WHERE id = w.id;

    -- Insert a member row for every user attached to this wedding (skip if already exists)
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
        WHERE "organizationId" = org_id
          AND "userId" = uw."userId"
      );
    END LOOP;

  END LOOP;
END $$;
