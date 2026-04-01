-- Etta AI Agent tables
-- Creates all tables required for the dual-persona agent system.

-- ── etta_actors ──────────────────────────────────────────────────────────────
CREATE TABLE "etta_actors" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "wedding_id" UUID NOT NULL,
  "actor_type" TEXT NOT NULL DEFAULT 'etta',
  "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "provisioned_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "last_active_at" TIMESTAMPTZ,
  "revoked_at" TIMESTAMPTZ,

  CONSTRAINT "etta_actors_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "etta_actors_wedding_id_key" UNIQUE ("wedding_id"),
  CONSTRAINT "etta_actors_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "Wedding"("id") ON DELETE CASCADE
);

-- ── etta_suggestions ─────────────────────────────────────────────────────────
CREATE TABLE "etta_suggestions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "wedding_id" UUID NOT NULL,
  "actor_id" UUID NOT NULL,
  "action_type" TEXT NOT NULL,
  "tier" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "summary" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "chat_message_id" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "resolved_at" TIMESTAMPTZ,
  "resolved_by" TEXT,

  CONSTRAINT "etta_suggestions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "etta_suggestions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "etta_actors"("id") ON UPDATE CASCADE,
  CONSTRAINT "etta_suggestions_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "Wedding"("id") ON DELETE CASCADE
);

CREATE INDEX "etta_suggestions_wedding_id_status_idx" ON "etta_suggestions"("wedding_id", "status");
CREATE INDEX "etta_suggestions_created_at_idx" ON "etta_suggestions"("created_at" DESC);

-- ── etta_memory ──────────────────────────────────────────────────────────────
-- Note: the embedding column (pgvector) is added separately via
-- 20260401150001_add_etta_memory_pgvector — it requires the pgvector
-- extension which must be enabled in your database provider first.
-- Memory works without embeddings (keyword fallback).
CREATE TABLE "etta_memory" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "wedding_id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "etta_memory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "etta_memory_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "Wedding"("id") ON DELETE CASCADE
);

CREATE INDEX "etta_memory_wedding_id_idx" ON "etta_memory"("wedding_id");

-- ── audit_log ────────────────────────────────────────────────────────────────
CREATE TABLE "audit_log" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "wedding_id" UUID NOT NULL,
  "actor_id" TEXT NOT NULL,
  "actor_type" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "resource_type" TEXT NOT NULL,
  "resource_id" TEXT,
  "tier" TEXT,
  "payload_snapshot" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "audit_log_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "Wedding"("id") ON DELETE CASCADE
);

CREATE INDEX "audit_log_wedding_id_created_at_idx" ON "audit_log"("wedding_id", "created_at" DESC);
CREATE INDEX "audit_log_actor_id_idx" ON "audit_log"("actor_id");

-- ── guest_questions ──────────────────────────────────────────────────────────
CREATE TABLE "guest_questions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "wedding_id" UUID NOT NULL,
  "guest_id" INTEGER NOT NULL,
  "question" TEXT NOT NULL,
  "context" TEXT,
  "answered" BOOLEAN NOT NULL DEFAULT false,
  "answer" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "answered_at" TIMESTAMPTZ,

  CONSTRAINT "guest_questions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "guest_questions_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "Wedding"("id") ON DELETE CASCADE,
  CONSTRAINT "guest_questions_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "Guest"("id") ON DELETE CASCADE
);

CREATE INDEX "guest_questions_wedding_id_answered_idx" ON "guest_questions"("wedding_id", "answered");

-- ── faqs ─────────────────────────────────────────────────────────────────────
CREATE TABLE "faqs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "wedding_id" UUID NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "faqs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "faqs_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "Wedding"("id") ON DELETE CASCADE
);

CREATE INDEX "faqs_wedding_id_published_idx" ON "faqs"("wedding_id", "published");

-- ── notifications ────────────────────────────────────────────────────────────
CREATE TABLE "notifications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "wedding_id" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notifications_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "Wedding"("id") ON DELETE CASCADE
);

CREATE INDEX "notifications_wedding_id_read_idx" ON "notifications"("wedding_id", "read");
