/**
 * POST /api/webhooks/whatsapp
 *
 * Twilio WhatsApp webhook entrypoint. Validates the X-Twilio-Signature,
 * enforces a per-sender rate limit, and hands the message off to the handler
 * via `after()` so we can ack the webhook quickly. Responds with empty TwiML
 * so Twilio doesn't send an auto-reply.
 */

import { after } from 'next/server'
import { env } from '~/env'
import { validateTwilioSignature } from '~/lib/whatsapp/signature'
import type { TwilioInboundMessage } from '~/lib/whatsapp/types'
import { getWhatsAppHandler, getWhatsAppRateLimiter } from '~/server/application/messaging'

export const runtime = 'nodejs'
export const maxDuration = 60

const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'

const twimlResponse = () =>
  new Response(EMPTY_TWIML, { status: 200, headers: { 'content-type': 'text/xml' } })

export async function POST(req: Request): Promise<Response> {
  const authToken = env.TWILIO_AUTH_TOKEN
  if (!authToken) {
    return new Response('not configured', { status: 503 })
  }

  let params: Record<string, string>
  try {
    const form = await req.formData()
    params = Object.fromEntries(
      [...form.entries()].filter(([, value]) => typeof value === 'string')
    ) as Record<string, string>
  } catch {
    return new Response('bad request', { status: 400 })
  }

  // Twilio signs the URL it was configured with; behind proxies that can
  // differ from req.url, so allow an explicit override.
  const webhookUrl = env.WHATSAPP_WEBHOOK_URL ?? req.url
  const signature = req.headers.get('x-twilio-signature')
  if (!validateTwilioSignature(authToken, signature, webhookUrl, params)) {
    return new Response('forbidden', { status: 403 })
  }

  const inbound = params as unknown as TwilioInboundMessage
  if (!inbound.From || !inbound.To) {
    return twimlResponse()
  }

  const limiter = getWhatsAppRateLimiter()
  const allowed = await limiter.check(`wa:${inbound.From}`)
  if (!allowed) {
    return twimlResponse()
  }

  const handler = getWhatsAppHandler()
  after(async () => {
    try {
      await handler.handle(inbound)
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: background handler error
      console.error('[whatsapp-webhook]', error)
    }
  })

  return twimlResponse()
}
