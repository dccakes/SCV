/**
 * GET /api/cron/purge-rate-limits
 *
 * Vercel Cron entrypoint (daily, see vercel.json). Deletes rate limit rows whose window ended long
 * ago. Keys include the client IP, so without this both tables grow without bound:
 * - `rate_limit_buckets`: our limiter (`windowStart`, a timestamp).
 * - `rate_limit`: Better Auth's own database-backed limiter (`lastRequest`, epoch milliseconds).
 * Guarded by `CRON_SECRET`.
 */

import { env } from '~/env'
import { db } from '~/server/db'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * The longest window of either limiter is 10 minutes (ours) or 60 seconds (Better Auth's), so
 * anything older than this cannot affect a decision.
 */
const RETENTION_MS = 60 * 60_000

export async function GET(req: Request): Promise<Response> {
  const auth = req.headers.get('authorization')
  if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
    return new Response('forbidden', { status: 403 })
  }

  const cutoff = Date.now() - RETENTION_MS
  const [buckets, authLimits] = await Promise.all([
    db.rateLimitBucket.deleteMany({ where: { windowStart: { lt: new Date(cutoff) } } }),
    db.rateLimit.deleteMany({ where: { lastRequest: { lt: BigInt(cutoff) } } }),
  ])

  return Response.json({ ok: true, deleted: buckets.count, deletedAuthLimits: authLimits.count })
}
