/**
 * Unit tests for PrismaRateLimiter's mapping from the SQL row to a decision.
 *
 * The SQL (atomic upsert, window reset, concurrency) cannot be proven with a mock; that is
 * covered by prisma-rate-limiter.integration.test.ts against a real Postgres.
 */

import { PrismaRateLimiter } from '~/server/infrastructure/rate-limit/prisma-rate-limiter'

function build(rows: { count: number; reset_ms: number }[]) {
  const $queryRaw = jest.fn().mockResolvedValue(rows)
  return { $queryRaw, db: { $queryRaw } as never }
}

describe('PrismaRateLimiter', () => {
  it('allows a hit inside the limit and reports remaining and reset', async () => {
    const { db } = build([{ count: 1, reset_ms: 60_000 }])
    const limiter = new PrismaRateLimiter(db, { limit: 3, windowMs: 60_000 })

    expect(await limiter.consume('user:1')).toEqual({
      allowed: true,
      limit: 3,
      remaining: 2,
      resetMs: 60_000,
      retryAfterMs: 0,
    })
  })

  it('still allows the hit that lands exactly on the limit', async () => {
    const { db } = build([{ count: 3, reset_ms: 20_000 }])
    const limiter = new PrismaRateLimiter(db, { limit: 3, windowMs: 60_000 })

    expect(await limiter.consume('user:1')).toMatchObject({
      allowed: true,
      remaining: 0,
      retryAfterMs: 0,
    })
  })

  it('blocks the first hit over the limit and reports how long to wait', async () => {
    const { db } = build([{ count: 4, reset_ms: 45_000 }])
    const limiter = new PrismaRateLimiter(db, { limit: 3, windowMs: 60_000 })

    expect(await limiter.consume('user:1')).toEqual({
      allowed: false,
      limit: 3,
      remaining: 0,
      resetMs: 45_000,
      retryAfterMs: 45_000,
    })
  })

  it('keeps remaining at zero however far over the limit the count is', async () => {
    const { db } = build([{ count: 500, reset_ms: 1_000 }])
    const limiter = new PrismaRateLimiter(db, { limit: 3, windowMs: 60_000 })

    expect((await limiter.consume('user:1')).remaining).toBe(0)
  })

  it('clamps a negative reset time to zero', async () => {
    const { db } = build([{ count: 9, reset_ms: -250 }])
    const limiter = new PrismaRateLimiter(db, { limit: 3, windowMs: 60_000 })

    expect(await limiter.consume('user:1')).toMatchObject({ resetMs: 0, retryAfterMs: 0 })
  })

  it('passes the key and window length to the statement as parameters', async () => {
    const { db, $queryRaw } = build([{ count: 1, reset_ms: 1 }])
    const limiter = new PrismaRateLimiter(db, { limit: 3, windowMs: 60_000 })

    await limiter.consume('user:1')

    const [, ...values] = $queryRaw.mock.calls[0] as [unknown, ...unknown[]]
    expect(values).toContain('user:1')
    expect(values.filter((value) => value === 60_000)).toHaveLength(3)
  })

  it('throws if the statement returns no row so the caller can fail open', async () => {
    const { db } = build([])
    const limiter = new PrismaRateLimiter(db, { limit: 3, windowMs: 60_000 })

    await expect(limiter.consume('user:1')).rejects.toThrow('returned no row')
  })

  it('check() is just the allowed flag', async () => {
    const allowed = new PrismaRateLimiter(build([{ count: 1, reset_ms: 1 }]).db, {
      limit: 1,
      windowMs: 1,
    })
    const blocked = new PrismaRateLimiter(build([{ count: 2, reset_ms: 1 }]).db, {
      limit: 1,
      windowMs: 1,
    })

    expect(await allowed.check('k')).toBe(true)
    expect(await blocked.check('k')).toBe(false)
  })
})
