-- Migration: etta_core
-- Creates all tables required for Etta's dual-persona agent system.
-- Run after your core OSWP tables (Wedding, Guest, etc.) exist.

-- ── etta_actors ──────────────────────────────────────────────────────────────
-- One row per wedding. Provisioned silently on wedding.created.
CREATE TABLE etta_actors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id        UUID NOT NULL REFERENCES "Wedding"(id) ON DELETE CASCADE,
  actor_type        TEXT NOT NULL DEFAULT 'etta',
  permissions       TEXT[] NOT NULL DEFAULT '{}',
  provisioned_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at    TIMESTAMPTZ,
  revoked_at        TIMESTAMPTZ,

  CONSTRAINT etta_actors_wedding_unique UNIQUE (wedding_id)
);

CREATE INDEX idx_etta_actors_wedding ON etta_actors(wedding_id);

-- ── etta_suggestions ─────────────────────────────────────────────────────────
-- T1 (suggestions shown in dashboard) and T2 (approval-required actions).
CREATE TABLE etta_suggestions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id      UUID NOT NULL REFERENCES "Wedding"(id) ON DELETE CASCADE,
  actor_id        UUID NOT NULL REFERENCES etta_actors(id),
  action_type     TEXT NOT NULL,
  tier            TEXT NOT NULL CHECK (tier IN ('T1', 'T2')),
  payload         JSONB NOT NULL,
  summary         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'dismissed', 'executed')),
  chat_message_id UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ,
  resolved_by     UUID
);

CREATE INDEX idx_etta_suggestions_wedding_status ON etta_suggestions(wedding_id, status);
CREATE INDEX idx_etta_suggestions_created ON etta_suggestions(created_at DESC);

-- ── etta_memory ──────────────────────────────────────────────────────────────
-- Semantic memory store for long-term couple preferences and decisions.
-- Requires pgvector extension.
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE etta_memory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  UUID NOT NULL REFERENCES "Wedding"(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  embedding   VECTOR(1536),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HNSW index for approximate nearest-neighbour search (handles incremental inserts)
CREATE INDEX idx_etta_memory_embedding ON etta_memory
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_etta_memory_wedding ON etta_memory(wedding_id);

-- ── audit_log ────────────────────────────────────────────────────────────────
-- Unified audit trail: every action by couple, Etta, or guest is recorded.
CREATE TABLE audit_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id       UUID NOT NULL REFERENCES "Wedding"(id) ON DELETE CASCADE,
  actor_id         UUID NOT NULL,
  actor_type       TEXT NOT NULL CHECK (actor_type IN ('etta', 'couple', 'guest')),
  action           TEXT NOT NULL,
  resource_type    TEXT NOT NULL,
  resource_id      TEXT,
  tier             TEXT CHECK (tier IN ('T0', 'T1', 'T2')),
  payload_snapshot JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_wedding ON audit_log(wedding_id, created_at DESC);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);

-- ── guest_questions ──────────────────────────────────────────────────────────
-- Unanswered guest questions flagged by Etta Concierge for couple to answer.
CREATE TABLE guest_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  UUID NOT NULL REFERENCES "Wedding"(id) ON DELETE CASCADE,
  guest_id    INT NOT NULL REFERENCES "Guest"(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  context     TEXT,
  answered    BOOLEAN NOT NULL DEFAULT FALSE,
  answer      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  answered_at TIMESTAMPTZ
);

CREATE INDEX idx_guest_questions_wedding ON guest_questions(wedding_id, answered);

-- ── faqs ─────────────────────────────────────────────────────────────────────
-- Couple-authored FAQ entries surfaced to Etta Concierge for guest queries.
CREATE TABLE faqs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  UUID NOT NULL REFERENCES "Wedding"(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  published   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_faqs_wedding_published ON faqs(wedding_id, published);

-- ── notifications ────────────────────────────────────────────────────────────
-- In-app notifications for the couple (RSVP submissions, unanswered questions).
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  UUID NOT NULL REFERENCES "Wedding"(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  payload     JSONB NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_wedding_unread ON notifications(wedding_id, read);
