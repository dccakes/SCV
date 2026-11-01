/**
 * Postgres-backed sliding window rate limiter.
 *
 * Uses the `RateLimitBucket` table: one row per key, tracking a count and
 * the start of the current window. When a hit arrives after the window has
 * expired the row is reset; otherwise the count is atomically incremented
 * and compared against the configured limit.
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
  /** Milliseconds until the current window ends. Only meaningful when `allowed` is false. */
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
    const now = new Date()
    const existing = await this.db.rateLimitBucket.findUnique({ where: { key } })

    // No bucket yet — create it with this hit as the first entry.
    if (!existing) {
      await this.db.rateLimitBucket.upsert({
        where: { key },
        create: { id: randomUUID(), key, count: 1, windowStart: now },
        update: {},
      })
      return { allowed: true, retryAfterMs: 0 }
    }

    // Window expired — reset atomically to a new window starting now.
    if (now.getTime() - existing.windowStart.getTime() > windowMs) {
      await this.db.rateLimitBucket.update({
        where: { key },
        data: { count: 1, windowStart: now },
      })
      return { allowed: true, retryAfterMs: 0 }
    }

    // Live window — atomically increment and compare the returned count.
    const updated = await this.db.rateLimitBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
    })
    const allowed = updated.count <= limit
    const retryAfterMs = Math.max(0, existing.windowStart.getTime() + windowMs - now.getTime())
    return { allowed, retryAfterMs: allowed ? 0 : retryAfterMs }
  }
}
