/**
 * GET /api/cron/purge-rate-limits
 *
 * Vercel Cron entrypoint (hourly, see vercel.json). Deletes rate limit buckets whose window ended
 * long ago. Keys include the client IP, so without this the table grows without bound. Guarded
 * by `CRON_SECRET`.
 */

import { env } from '~/env'
import { db } from '~/server/db'

export const runtime = 'nodejs'
export const maxDuration = 60

/** The longest policy window is 10 minutes, so anything older than this cannot affect a decision. */
const RETENTION_MS = 60 * 60_000

export async function GET(req: Request): Promise<Response> {
  const auth = req.headers.get('authorization')
  if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
    return new Response('forbidden', { status: 403 })
  }

  const { count } = await db.rateLimitBucket.deleteMany({
    where: { windowStart: { lt: new Date(Date.now() - RETENTION_MS) } },
  })

  return Response.json({ ok: true, deleted: count })
}
