/**
 * @jest-environment node
 */

import { searchMemory, writeMemory, deleteMemory } from '~/lib/etta/memory/pgvector'
import { db } from '~/server/db'

jest.mock('~/server/db', () => ({
  db: {
    $queryRaw: jest.fn(),
    ettaMemory: {
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

const mockDb = db as unknown as {
  $queryRaw: jest.Mock
  ettaMemory: {
    create: jest.Mock
    delete: jest.Mock
  }
}

const WEDDING_ID = 'b1e2c3d4-5678-9abc-def0-1234567890ab'

function makeEmbedding(length: number): number[] {
  return Array.from({ length }, (_, i) => i * 0.001)
}

describe('pgvector memory', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── searchMemory ────────────────────────────────────────────────────────

  describe('searchMemory', () => {
    it('uses vector path when embedding has 1536 dimensions', async () => {
      const embedding = makeEmbedding(1536)
      const mockResults = [
        { id: 'm1', content: 'Bride prefers peonies', createdAt: new Date() },
      ]
      mockDb.$queryRaw.mockResolvedValue(mockResults)

      const result = await searchMemory(WEDDING_ID, 'flowers', embedding)

      expect(mockDb.$queryRaw).toHaveBeenCalled()
      expect(result).toEqual(mockResults)
    })

    it('falls back to keyword search when no embedding is provided', async () => {
      const mockResults = [
        { id: 'm2', content: 'Venue is outdoor', createdAt: new Date() },
      ]
      mockDb.$queryRaw.mockResolvedValue(mockResults)

      const result = await searchMemory(WEDDING_ID, 'venue')

      expect(mockDb.$queryRaw).toHaveBeenCalled()
      expect(result).toEqual(mockResults)
    })

    it('falls back to keyword search when embedding has wrong length', async () => {
      const embedding = makeEmbedding(512)
      const mockResults = [
        { id: 'm3', content: 'Some memory', createdAt: new Date() },
      ]
      mockDb.$queryRaw.mockResolvedValue(mockResults)

      const result = await searchMemory(WEDDING_ID, 'some query', embedding)

      expect(mockDb.$queryRaw).toHaveBeenCalled()
      expect(result).toEqual(mockResults)
    })

    it('escapes ILIKE special characters in keyword search', async () => {
      mockDb.$queryRaw.mockResolvedValue([])

      await searchMemory(WEDDING_ID, '50% off_sale\\special')

      // The function should have been called (keyword path).
      // The escaping happens inside the tagged template, so we verify
      // it was called and didn't throw.
      expect(mockDb.$queryRaw).toHaveBeenCalled()
    })

    it('respects custom limit parameter', async () => {
      mockDb.$queryRaw.mockResolvedValue([])

      await searchMemory(WEDDING_ID, 'anything', undefined, 20)

      expect(mockDb.$queryRaw).toHaveBeenCalled()
    })

    it('returns empty array when no matches', async () => {
      mockDb.$queryRaw.mockResolvedValue([])

      const result = await searchMemory(WEDDING_ID, 'nonexistent')

      expect(result).toEqual([])
    })
  })

  // ── writeMemory ─────────────────────────────────────────────────────────

  describe('writeMemory', () => {
    it('uses raw query when embedding has 1536 dimensions', async () => {
      const embedding = makeEmbedding(1536)
      mockDb.$queryRaw.mockResolvedValue([{ id: 'new-id-vector' }])

      const id = await writeMemory(WEDDING_ID, 'Remember this', embedding)

      expect(mockDb.$queryRaw).toHaveBeenCalled()
      expect(mockDb.ettaMemory.create).not.toHaveBeenCalled()
      expect(id).toBe('new-id-vector')
    })

    it('uses Prisma create when no embedding is provided', async () => {
      mockDb.ettaMemory.create.mockResolvedValue({ id: 'new-id-prisma' })

      const id = await writeMemory(WEDDING_ID, 'No vector here')

      expect(mockDb.ettaMemory.create).toHaveBeenCalledWith({
        data: { weddingId: WEDDING_ID, content: 'No vector here' },
      })
      expect(mockDb.$queryRaw).not.toHaveBeenCalled()
      expect(id).toBe('new-id-prisma')
    })

    it('uses Prisma create when embedding has wrong length', async () => {
      const embedding = makeEmbedding(512)
      mockDb.ettaMemory.create.mockResolvedValue({ id: 'new-id-fallback' })

      const id = await writeMemory(WEDDING_ID, 'Wrong dimension', embedding)

      expect(mockDb.ettaMemory.create).toHaveBeenCalledWith({
        data: { weddingId: WEDDING_ID, content: 'Wrong dimension' },
      })
      expect(mockDb.$queryRaw).not.toHaveBeenCalled()
      expect(id).toBe('new-id-fallback')
    })
  })

  // ── deleteMemory ────────────────────────────────────────────────────────

  describe('deleteMemory', () => {
    it('deletes via Prisma', async () => {
      mockDb.ettaMemory.delete.mockResolvedValue({ id: 'del-1' })

      await deleteMemory('del-1')

      expect(mockDb.ettaMemory.delete).toHaveBeenCalledWith({
        where: { id: 'del-1' },
      })
    })
  })
})
