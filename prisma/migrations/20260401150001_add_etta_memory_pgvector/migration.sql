-- Optional: adds pgvector embedding column to etta_memory.
-- Requires the pgvector extension to be enabled in your database.
--
-- Neon: enable via Dashboard → Extensions → pgvector
-- Supabase: enable via Dashboard → Database → Extensions → vector
-- Self-hosted: run `CREATE EXTENSION vector;` as superuser
--
-- If this migration fails, Etta still works — memory_read falls
-- back to keyword search (ILIKE) instead of semantic search.

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "etta_memory" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

CREATE INDEX IF NOT EXISTS "etta_memory_embedding_idx"
  ON "etta_memory" USING hnsw ("embedding" vector_cosine_ops);
