/**
 * POST /api/webhooks/telegram
 *
 * Telegram Bot API webhook entrypoint. Verifies the shared secret header,
 * enforces a per-chat rate limit, and hands the update off to the handler via
 * `after()` so we can ack the webhook in under a second.
 */

import { after } from 'next/server'
import { env } from '~/env'
import { ANALYTICS_ACTIONS, ANALYTICS_SCOPES, buildEventName } from '~/lib/analytics/events'
import type { TelegramUpdate } from '~/lib/telegram/types'
import { getTelegramHandler, getTelegramRateLimiter } from '~/server/application/messaging'
import { captureServerEvent } from '~/server/infrastructure/analytics/capture'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request): Promise<Response> {
  const secret = req.headers.get('x-telegram-bot-api-secret-token')
  if (!env.TELEGRAM_WEBHOOK_SECRET || secret !== env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response('forbidden', { status: 403 })
  }

  let update: TelegramUpdate
  try {
    update = (await req.json()) as TelegramUpdate
  } catch {
    return new Response('bad request', { status: 400 })
  }

  const chatId = update.message?.chat.id
  if (typeof chatId === 'number') {
    const limiter = getTelegramRateLimiter()
    const allowed = await limiter.check(`tg:${chatId}`)
    if (!allowed) {
      return Response.json({ ok: true })
    }
  }

  captureServerEvent({
    event: buildEventName({
      scope: ANALYTICS_SCOPES.messaging,
      object: 'webhook_update',
      action: ANALYTICS_ACTIONS.received,
    }),
    context: {
      distinctId: `telegram:${String(chatId ?? 'unknown')}`,
      isAuthenticated: false,
    },
    properties: {
      has_message: Boolean(update.message),
      update_id: update.update_id,
    },
  })

  const handler = getTelegramHandler()
  after(async () => {
    try {
      await handler.handle(update)
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: background handler error
      console.error('[telegram-webhook]', error)
    }
  })

  return Response.json({ ok: true })
}
