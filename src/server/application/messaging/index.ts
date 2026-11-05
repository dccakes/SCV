/**
 * Messaging application-layer singletons.
 *
 * Imported from `/api/webhooks/telegram` and `/api/cron/summarize-stale-sessions`.
 * Keeping construction here ensures the Telegram client, session summariser, and
 * rate limiter are shared across requests inside the same Lambda instance.
 */

import { env } from '~/env'
import { runEttaAgent } from '~/lib/etta/agent'
import { TelegramClient } from '~/lib/telegram/client'
import { SessionSummarizer } from '~/server/application/messaging/session-summarizer'
import { TelegramHandler } from '~/server/application/messaging/telegram-handler'
import { feedbackService } from '~/server/domains/feedback'
import { messagingService } from '~/server/domains/messaging'
import { db } from '~/server/infrastructure/database'
import { PrismaRateLimiter } from '~/server/infrastructure/rate-limit'
import { putServerBlob } from '~/server/infrastructure/storage'

export { SessionSummarizer } from '~/server/application/messaging/session-summarizer'
export { TelegramHandler } from '~/server/application/messaging/telegram-handler'

let _handler: TelegramHandler | null = null
let _summarizer: SessionSummarizer | null = null
let _rateLimiter: PrismaRateLimiter | null = null

export function getSessionSummarizer(): SessionSummarizer {
  if (!_summarizer) {
    _summarizer = new SessionSummarizer({ messaging: messagingService, runEtta: runEttaAgent })
  }
  return _summarizer
}

export function getTelegramHandler(): TelegramHandler {
  if (!_handler) {
    const token = env.TELEGRAM_BOT_TOKEN
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured')
    }
    _handler = new TelegramHandler({
      messaging: messagingService,
      tg: new TelegramClient(token),
      blob: putServerBlob,
      runEtta: runEttaAgent,
      summarizer: getSessionSummarizer(),
      feedback: feedbackService,
      debounceMs: env.TELEGRAM_DEBOUNCE_MS,
    })
  }
  return _handler
}

export function getTelegramRateLimiter(): PrismaRateLimiter {
  if (!_rateLimiter) {
    _rateLimiter = new PrismaRateLimiter(db, { limit: 30, windowMs: 60_000 })
  }
  return _rateLimiter
}

export function getStaleSessionGapMs(): number {
  return env.TELEGRAM_SESSION_GAP_MS ?? 30 * 60_000
}
