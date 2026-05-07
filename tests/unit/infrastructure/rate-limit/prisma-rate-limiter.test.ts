/**
 * Tests for PrismaRateLimiter — sliding window against mock Prisma delegate.
 */

import { PrismaRateLimiter } from '~/server/infrastructure/rate-limit/prisma-rate-limiter'

interface Bucket {
  id: string
  key: string
  count: number
  windowStart: Date
}

function buildMockDb() {
  const store = new Map<string, Bucket>()

  const upsert = jest.fn(
    async ({
      where,
      create,
      update,
    }: {
      where: { key: string }
      create: Bucket
      update: Partial<Bucket>
    }) => {
      const existing = store.get(where.key)
      if (!existing) {
        const row = { ...create }
        store.set(where.key, row)
        return row
      }
      const merged = { ...existing, ...update }
      store.set(where.key, merged)
      return merged
    }
  )

  const findUnique = jest.fn(async ({ where }: { where: { key: string } }) => {
    return store.get(where.key) ?? null
  })

  const update = jest.fn(
    async ({
      where,
      data,
    }: {
      where: { key: string }
      data: Partial<Bucket> & { count?: number | { increment: number } }
    }) => {
      const row = store.get(where.key)
      if (!row) throw new Error('not found')
      const nextCount =
        typeof data.count === 'object' && data.count && 'increment' in data.count
          ? row.count + data.count.increment
          : typeof data.count === 'number'
            ? data.count
            : row.count
      const merged: Bucket = {
        ...row,
        count: nextCount,
        windowStart: data.windowStart ?? row.windowStart,
      }
      store.set(where.key, merged)
      return merged
    }
  )

  return {
    store,
    db: {
      rateLimitBucket: { upsert, findUnique, update },
    } as never,
  }
}

describe('PrismaRateLimiter', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-21T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('allows the first hit and initializes the bucket', async () => {
    const { db, store } = buildMockDb()
    const limiter = new PrismaRateLimiter(db, { limit: 3, windowMs: 60_000 })

    const allowed = await limiter.check('user:1')

    expect(allowed).toBe(true)
    const row = store.get('user:1')
    expect(row?.count).toBe(1)
    expect(row?.windowStart.toISOString()).toBe('2026-04-21T12:00:00.000Z')
  })

  it('increments the count on subsequent hits within the window', async () => {
    const { db, store } = buildMockDb()
    const limiter = new PrismaRateLimiter(db, { limit: 3, windowMs: 60_000 })

    await limiter.check('user:1')
    jest.advanceTimersByTime(1_000)
    const allowed = await limiter.check('user:1')

    expect(allowed).toBe(true)
    expect(store.get('user:1')?.count).toBe(2)
  })

  it('blocks when the count exceeds the limit within the window', async () => {
    const { db, store } = buildMockDb()
    const limiter = new PrismaRateLimiter(db, { limit: 2, windowMs: 60_000 })

    expect(await limiter.check('user:1')).toBe(true)
    expect(await limiter.check('user:1')).toBe(true)
    expect(await limiter.check('user:1')).toBe(false)
    expect(store.get('user:1')?.count).toBe(3)
  })

  it('resets when the window has expired', async () => {
    const { db, store } = buildMockDb()
    const limiter = new PrismaRateLimiter(db, { limit: 2, windowMs: 60_000 })

    await limiter.check('user:1')
    await limiter.check('user:1')
    expect(await limiter.check('user:1')).toBe(false)

    jest.advanceTimersByTime(60_001)

    const allowed = await limiter.check('user:1')

    expect(allowed).toBe(true)
    const row = store.get('user:1')
    expect(row?.count).toBe(1)
    expect(row?.windowStart.toISOString()).toBe('2026-04-21T12:01:00.001Z')
  })

  it('tracks different keys independently', async () => {
    const { db } = buildMockDb()
    const limiter = new PrismaRateLimiter(db, { limit: 1, windowMs: 60_000 })

    expect(await limiter.check('a')).toBe(true)
    expect(await limiter.check('b')).toBe(true)
    expect(await limiter.check('a')).toBe(false)
    expect(await limiter.check('b')).toBe(false)
  })
})
