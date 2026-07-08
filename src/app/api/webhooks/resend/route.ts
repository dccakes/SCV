/**
 * POST /api/webhooks/resend
 *
 * Resend inbound-email webhook entrypoint. Verifies the Svix signature, parses
 * the parsed-email payload, resolves the recipient to a wedding inbox, and hands
 * ingestion + AI triage off via `after()` so we ack in well under a second.
 */

import { after } from 'next/server'
import { env } from '~/env'
import { ANALYTICS_ACTIONS, ANALYTICS_SCOPES, buildEventName } from '~/lib/analytics/events'
import {
  isInboundEventType,
  normalizeInboundEmail,
  resendWebhookSchema,
  verifyResendSignature,
} from '~/lib/email/resend-webhook'
import { getInboundEmailHandler } from '~/server/application/email'
import { emailService } from '~/server/domains/email'
import { captureServerEvent } from '~/server/infrastructure/analytics/capture'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request): Promise<Response> {
  // Raw body is required for signature verification.
  const rawBody = await req.text()

  const verified = verifyResendSignature({
    secret: env.RESEND_INBOUND_SIGNING_SECRET,
    payload: rawBody,
    svixId: req.headers.get('svix-id'),
    svixTimestamp: req.headers.get('svix-timestamp'),
    svixSignature: req.headers.get('svix-signature'),
  })
  if (!verified) {
    return new Response('forbidden', { status: 403 })
  }

  let json: unknown
  try {
    json = JSON.parse(rawBody)
  } catch {
    return new Response('bad request', { status: 400 })
  }

  const parsed = resendWebhookSchema.safeParse(json)
  if (!parsed.success) {
    return new Response('bad request', { status: 400 })
  }

  // Only act on inbound-received events; ack everything else.
  if (!isInboundEventType(parsed.data.type)) {
    return Response.json({ ok: true })
  }

  const inbound = normalizeInboundEmail(parsed.data)
  if (!inbound) {
    return Response.json({ ok: true })
  }

  captureServerEvent({
    event: buildEventName({
      scope: ANALYTICS_SCOPES.messaging,
      object: 'inbound_email',
      action: ANALYTICS_ACTIONS.received,
    }),
    context: { distinctId: `email:${inbound.fromAddress}`, isAuthenticated: false },
    properties: {
      recipient_count: inbound.to.length,
      has_attachments: inbound.attachments.length > 0,
    },
  })

  after(async () => {
    try {
      // Resolve the first recipient that maps to a provisioned wedding inbox.
      let inbox = null
      for (const recipient of inbound.to) {
        inbox = await emailService.resolveInboxByAddress(recipient)
        if (inbox) break
      }
      if (!inbox) return

      await getInboundEmailHandler().handle(inbox, inbound)
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: background handler error
      console.error('[resend-webhook]', error)
    }
  })

  return Response.json({ ok: true })
}
