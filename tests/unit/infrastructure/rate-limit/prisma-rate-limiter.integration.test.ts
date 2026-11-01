/**
 * @jest-environment node
 *
 * Runs the limiter's SQL against a real Postgres. Skipped unless RATE_LIMIT_TEST_DATABASE_URL
 * points at a database that already has the rate_limit_buckets table (apply the migrations).
 * The mock-based tests cannot prove the atomicity this suite checks.
 *
 *   RATE_LIMIT_TEST_DATABASE_URL=postgresql://... npx jest prisma-rate-limiter.integration
 */

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { PrismaRateLimiter } from '~/server/infrastructure/rate-limit/prisma-rate-limiter'

const url = process.env.RATE_LIMIT_TEST_DATABASE_URL
const describeDb = url ? describe : describe.skip

describeDb('PrismaRateLimiter against Postgres', () => {
  let db: PrismaClient
  const runId = `it-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const keyFor = (name: string) => `${runId}:${name}`

  beforeAll(() => {
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })
  })

  afterAll(async () => {
    await db.rateLimitBucket.deleteMany({ where: { key: { startsWith: runId } } })
    await db.$disconnect()
  })

  it('counts a concurrent burst exactly: no lost increments on first hit', async () => {
    const limiter = new PrismaRateLimiter(db, { limit: 10, windowMs: 60_000 })

    const results = await Promise.all(
      Array.from({ length: 50 }, () => limiter.consume(keyFor('burst')))
    )

    expect(results.filter((r) => r.allowed)).toHaveLength(10)
    expect(results.filter((r) => !r.allowed)).toHaveLength(40)
    const row = await db.rateLimitBucket.findUnique({ where: { key: keyFor('burst') } })
    expect(row?.count).toBe(50)
  })

  it('gives every concurrent caller a distinct remaining count', async () => {
    const limiter = new PrismaRateLimiter(db, { limit: 20, windowMs: 60_000 })

    const results = await Promise.all(
      Array.from({ length: 20 }, () => limiter.consume(keyFor('distinct')))
    )

    const remaining = results.map((r) => r.remaining).sort((a, b) => a - b)
    expect(remaining).toEqual(Array.from({ length: 20 }, (_, i) => i))
  })

  it('reports limit, remaining and a bounded reset time', async () => {
    const limiter = new PrismaRateLimiter(db, { limit: 2, windowMs: 60_000 })

    const first = await limiter.consume(keyFor('shape'))
    expect(first).toMatchObject({ allowed: true, limit: 2, remaining: 1, retryAfterMs: 0 })
    expect(first.resetMs).toBeGreaterThan(55_000)
    expect(first.resetMs).toBeLessThanOrEqual(60_000)

    await limiter.consume(keyFor('shape'))
    const blocked = await limiter.consume(keyFor('shape'))
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterMs).toBeGreaterThan(0)
    expect(blocked.retryAfterMs).toBeLessThanOrEqual(60_000)
  })

  it('resets after the window expires', async () => {
    const limiter = new PrismaRateLimiter(db, { limit: 1, windowMs: 400 })

    expect((await limiter.consume(keyFor('expiry'))).allowed).toBe(true)
    expect((await limiter.consume(keyFor('expiry'))).allowed).toBe(false)

    await new Promise((resolve) => setTimeout(resolve, 500))

    const afterExpiry = await limiter.consume(keyFor('expiry'))
    expect(afterExpiry).toMatchObject({ allowed: true, remaining: 0 })
    const row = await db.rateLimitBucket.findUnique({ where: { key: keyFor('expiry') } })
    expect(row?.count).toBe(1)
  })

  it('tracks keys independently', async () => {
    const limiter = new PrismaRateLimiter(db, { limit: 1, windowMs: 60_000 })

    expect((await limiter.consume(keyFor('a'))).allowed).toBe(true)
    expect((await limiter.consume(keyFor('b'))).allowed).toBe(true)
    expect((await limiter.consume(keyFor('a'))).allowed).toBe(false)
  })
})
