/**
 * GET /api/cron/summarize-stale-sessions
 *
 * Vercel Cron entrypoint. Runs every 30 minutes (see vercel.json). Finds
 * orphan chat messages older than the session gap and summarises them via
 * `SessionSummarizer.sweepStale`. Guarded by `CRON_SECRET`.
 */

import { env } from '~/env'
import { getSessionSummarizer, getStaleSessionGapMs } from '~/server/application/messaging'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: Request): Promise<Response> {
  const auth = req.headers.get('authorization')
  if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
    return new Response('forbidden', { status: 403 })
  }

  const summarizer = getSessionSummarizer()
  const summarized = await summarizer.sweepStale({ olderThanMs: getStaleSessionGapMs() })

  return Response.json({ ok: true, summarized })
}
