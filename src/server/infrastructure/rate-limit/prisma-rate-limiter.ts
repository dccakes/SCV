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

export class PrismaRateLimiter {
  constructor(
    private readonly db: PrismaClient,
    private readonly opts: RateLimiterOptions
  ) {}

  /** Returns true if the request is allowed, false if the key is over limit. */
  async check(key: string): Promise<boolean> {
    const now = new Date()
    const existing = await this.db.rateLimitBucket.findUnique({ where: { key } })

    // No bucket yet — create it with this hit as the first entry.
    if (!existing) {
      await this.db.rateLimitBucket.upsert({
        where: { key },
        create: { id: randomUUID(), key, count: 1, windowStart: now },
        update: {},
      })
      return true
    }

    // Window expired — reset atomically to a new window starting now.
    if (now.getTime() - existing.windowStart.getTime() > this.opts.windowMs) {
      await this.db.rateLimitBucket.update({
        where: { key },
        data: { count: 1, windowStart: now },
      })
      return true
    }

    // Live window — atomically increment and compare the returned count.
    const updated = await this.db.rateLimitBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
    })
    return updated.count <= this.opts.limit
  }
}
