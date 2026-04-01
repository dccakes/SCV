/**
 * Etta Memory — pgvector semantic search + write
 *
 * Uses raw SQL for vector operations since Prisma doesn't support
 * the pgvector extension natively. Falls back to keyword search
 * when embeddings are unavailable.
 */

import { db } from '~/server/db'

interface MemoryEntry {
  id: string
  content: string
  createdAt: Date
}

/**
 * Semantic search over wedding memories using cosine similarity.
 * Falls back to keyword (ILIKE) search if no embedding is provided.
 */
export async function searchMemory(
  weddingId: string,
  query: string,
  embedding?: number[],
  limit = 5
): Promise<MemoryEntry[]> {
  if (embedding && embedding.length === 1536) {
    // Semantic search via pgvector cosine distance
    const vectorStr = `[${embedding.join(',')}]`
    return db.$queryRaw<MemoryEntry[]>`
      SELECT id, content, created_at AS "createdAt"
      FROM etta_memory
      WHERE wedding_id = ${weddingId}::uuid
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${limit}
    `
  }

  // Keyword fallback — escape ILIKE metacharacters
  const escaped = query.replace(/[%_\\]/g, '\\$&')
  return db.$queryRaw<MemoryEntry[]>`
    SELECT id, content, created_at AS "createdAt"
    FROM etta_memory
    WHERE wedding_id = ${weddingId}::uuid
      AND content ILIKE ${`%${escaped}%`}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
}

/**
 * Write a memory entry with an optional embedding vector.
 */
export async function writeMemory(
  weddingId: string,
  content: string,
  embedding?: number[]
): Promise<string> {
  if (embedding && embedding.length === 1536) {
    const vectorStr = `[${embedding.join(',')}]`
    const result = await db.$queryRaw<{ id: string }[]>`
      INSERT INTO etta_memory (wedding_id, content, embedding)
      VALUES (${weddingId}::uuid, ${content}, ${vectorStr}::vector)
      RETURNING id
    `
    // INSERT...RETURNING always returns exactly one row
    return result[0]!.id
  }

  // Write without embedding
  const entry = await db.ettaMemory.create({
    data: { weddingId, content },
  })
  return entry.id
}

/**
 * Delete a memory entry by ID.
 */
export async function deleteMemory(id: string): Promise<void> {
  await db.ettaMemory.delete({ where: { id } })
}
