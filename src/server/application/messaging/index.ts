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
import { createWhatsAppClient, type WhatsAppClient } from '~/lib/whatsapp/client'
import { SessionSummarizer } from '~/server/application/messaging/session-summarizer'
import { TelegramHandler } from '~/server/application/messaging/telegram-handler'
import { WhatsAppHandler } from '~/server/application/messaging/whatsapp-handler'
import { WhatsAppOutboundService } from '~/server/application/messaging/whatsapp-outbound.service'
import { messagingService } from '~/server/domains/messaging'
import { db } from '~/server/infrastructure/database'
import { PrismaRateLimiter } from '~/server/infrastructure/rate-limit'
import { putServerBlob } from '~/server/infrastructure/storage'

export { SessionSummarizer } from '~/server/application/messaging/session-summarizer'
export { TelegramHandler } from '~/server/application/messaging/telegram-handler'
export { WhatsAppHandler } from '~/server/application/messaging/whatsapp-handler'
export { WhatsAppOutboundService } from '~/server/application/messaging/whatsapp-outbound.service'

let _handler: TelegramHandler | null = null
let _summarizer: SessionSummarizer | null = null
let _rateLimiter: PrismaRateLimiter | null = null
let _waClient: WhatsAppClient | null = null
let _waHandler: WhatsAppHandler | null = null
let _waRateLimiter: PrismaRateLimiter | null = null
let _waOutbound: WhatsAppOutboundService | null = null

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

export function getWhatsAppClient(): WhatsAppClient {
  if (!_waClient) {
    _waClient = createWhatsAppClient(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
  }
  return _waClient
}

export function getWhatsAppHandler(): WhatsAppHandler {
  if (!_waHandler) {
    _waHandler = new WhatsAppHandler({
      messaging: messagingService,
      wa: getWhatsAppClient(),
      runEtta: runEttaAgent,
      debounceMs: env.WHATSAPP_DEBOUNCE_MS,
    })
  }
  return _waHandler
}

export function getWhatsAppRateLimiter(): PrismaRateLimiter {
  if (!_waRateLimiter) {
    _waRateLimiter = new PrismaRateLimiter(db, { limit: 20, windowMs: 60_000 })
  }
  return _waRateLimiter
}

export function getWhatsAppOutbound(): WhatsAppOutboundService {
  if (!_waOutbound) {
    _waOutbound = new WhatsAppOutboundService({
      messaging: messagingService,
      wa: getWhatsAppClient(),
    })
  }
  return _waOutbound
}
