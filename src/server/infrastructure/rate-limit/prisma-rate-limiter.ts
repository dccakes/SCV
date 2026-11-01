/**
 * Postgres-backed fixed window rate limiter.
 *
 * Uses the `RateLimitBucket` table: one row per key, tracking a count and the start of the
 * current window. Every hit is a single `INSERT ... ON CONFLICT DO UPDATE` statement, so the
 * create, reset-on-expiry and increment cases are one atomic operation: concurrent requests
 * (many serverless instances) serialize on the row lock and each sees a distinct count.
 * Time comes from the database clock, so instances with skewed clocks agree.
 */

import { randomUUID } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'

export interface RateLimiterOptions {
  /** Maximum number of requests permitted inside one window. */
  limit: number
  /** Rolling window length in milliseconds. */
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  /** Maximum hits per window. */
  limit: number
  /** Hits left in the current window (0 when blocked). */
  remaining: number
  /** Milliseconds until the current window ends. */
  resetMs: number
  /** Milliseconds the caller should wait before retrying. 0 when allowed. */
  retryAfterMs: number
}

export class PrismaRateLimiter {
  constructor(
    private readonly db: PrismaClient,
    private readonly opts: RateLimiterOptions
  ) {}

  /** Returns true if the request is allowed, false if the key is over limit. */
  async check(key: string): Promise<boolean> {
    return (await this.consume(key)).allowed
  }

  /** Records a hit for the key and reports whether it is allowed plus when the window resets. */
  async consume(key: string): Promise<RateLimitResult> {
    const { windowMs, limit } = this.opts

    // window_start is TIMESTAMP(3) without time zone and Prisma stores UTC, hence AT TIME ZONE.
    const rows = await this.db.$queryRaw<{ count: number; reset_ms: number }[]>`
      INSERT INTO rate_limit_buckets (id, key, count, window_start)
      VALUES (${randomUUID()}, ${key}, 1, now() AT TIME ZONE 'UTC')
      ON CONFLICT (key) DO UPDATE SET
        count = CASE
          WHEN rate_limit_buckets.window_start
            <= (now() AT TIME ZONE 'UTC') - make_interval(secs => ${windowMs}::double precision / 1000)
          THEN 1
          ELSE rate_limit_buckets.count + 1
        END,
        window_start = CASE
          WHEN rate_limit_buckets.window_start
            <= (now() AT TIME ZONE 'UTC') - make_interval(secs => ${windowMs}::double precision / 1000)
          THEN now() AT TIME ZONE 'UTC'
          ELSE rate_limit_buckets.window_start
        END
      RETURNING
        count,
        (EXTRACT(EPOCH FROM (
          window_start + make_interval(secs => ${windowMs}::double precision / 1000)
          - (now() AT TIME ZONE 'UTC')
        )) * 1000)::int AS reset_ms
    `

    const row = rows[0]
    if (!row) {
      throw new Error('Rate limit upsert returned no row')
    }

    const allowed = row.count <= limit
    const resetMs = Math.max(0, row.reset_ms)
    return {
      allowed,
      limit,
      remaining: Math.max(0, limit - row.count),
      resetMs,
      retryAfterMs: allowed ? 0 : resetMs,
    }
  }
}
