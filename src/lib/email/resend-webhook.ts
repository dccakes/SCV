/**
 * Resend inbound webhook: signature verification + payload normalization.
 *
 * Resend signs webhooks with the Svix scheme. Rather than pull in the `svix`
 * package we verify inline: the signed content is `${id}.${timestamp}.${body}`,
 * HMAC-SHA256'd with the base64-decoded portion of the `whsec_...` secret, and
 * compared (constant-time) against the `v1,<sig>` entries in `svix-signature`.
 *
 * The inbound payload shape is normalized into a channel-agnostic `InboundEmail`
 * so the rest of the pipeline never touches provider quirks.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'

const FIVE_MINUTES_MS = 5 * 60 * 1000

export interface InboundAttachment {
  filename: string
  contentType: string
  size: number
  url?: string
  contentId?: string
}

export interface InboundEmail {
  /** Stable provider id used for idempotency. */
  providerId: string
  /**
   * Resend conversation id, when present. Preferred over the sender address for
   * grouping a reply chain into one thread (a vendor may reply from a different
   * address than they were first contacted on).
   */
  conversationId?: string
  fromAddress: string
  fromName?: string
  to: string[]
  cc: string[]
  subject: string
  text?: string
  html?: string
  messageIdHeader?: string
  inReplyTo?: string
  references: string[]
  attachments: InboundAttachment[]
}

/**
 * Verify a Svix-signed webhook. Returns true when any provided signature
 * matches and the timestamp is within tolerance. When no secret is configured
 * verification is skipped (returns true) so local/dev setups still function.
 */
export function verifyResendSignature(args: {
  secret: string | undefined
  payload: string
  svixId: string | null
  svixTimestamp: string | null
  svixSignature: string | null
  now?: number
}): boolean {
  const { secret, payload, svixId, svixTimestamp, svixSignature } = args
  if (!secret) return true // unconfigured → skip (dev)
  if (!svixId || !svixTimestamp || !svixSignature) return false

  const ts = Number(svixTimestamp)
  if (!Number.isFinite(ts)) return false
  const now = args.now ?? Date.now()
  if (Math.abs(now - ts * 1000) > FIVE_MINUTES_MS) return false

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const signedContent = `${svixId}.${svixTimestamp}.${payload}`
  const expected = createHmac('sha256', secretBytes).update(signedContent).digest('base64')
  const expectedBuf = Buffer.from(expected)

  // Header is space-delimited `v1,<sig>` entries; match any.
  return svixSignature.split(' ').some((entry) => {
    const sig = entry.includes(',') ? entry.split(',')[1] : entry
    if (!sig) return false
    const sigBuf = Buffer.from(sig)
    return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf)
  })
}

// ── Payload parsing ──────────────────────────────────────────────────────────

const addressObjectSchema = z.object({
  name: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
})

// Resend has emitted addresses as plain strings, `{ name, email }` objects, or
// arrays of either. Accept them all.
const addressFieldSchema = z.union([
  z.string(),
  addressObjectSchema,
  z.array(z.union([z.string(), addressObjectSchema])),
])

const attachmentSchema = z.object({
  filename: z.string().optional().nullable(),
  content_type: z.string().optional().nullable(),
  contentType: z.string().optional().nullable(),
  size: z.number().optional().nullable(),
  url: z.string().optional().nullable(),
  content_id: z.string().optional().nullable(),
})

const inboundDataSchema = z
  .object({
    email_id: z.string().optional().nullable(),
    id: z.string().optional().nullable(),
    conversation_id: z.string().optional().nullable(),
    conversationId: z.string().optional().nullable(),
    from: addressFieldSchema.optional().nullable(),
    to: addressFieldSchema.optional().nullable(),
    cc: addressFieldSchema.optional().nullable(),
    subject: z.string().optional().nullable(),
    text: z.string().optional().nullable(),
    html: z.string().optional().nullable(),
    message_id: z.string().optional().nullable(),
    in_reply_to: z.string().optional().nullable(),
    references: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .nullable(),
    headers: z.record(z.string(), z.string()).optional().nullable(),
    attachments: z.array(attachmentSchema).optional().nullable(),
  })
  .passthrough()

export const resendWebhookSchema = z
  .object({
    type: z.string().optional(),
    created_at: z.string().optional(),
    data: inboundDataSchema,
  })
  .passthrough()

export type ResendWebhookPayload = z.infer<typeof resendWebhookSchema>

/** Inbound event types Resend uses for parsed incoming mail. */
export function isInboundEventType(type: string | undefined): boolean {
  if (!type) return true // tolerate providers that omit type
  return type === 'email.received' || type === 'inbound.email.received' || type === 'email.inbound'
}

function parseSingleAddress(value: unknown): { address: string; name?: string } | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    // "Name <email@x.com>" form.
    const angle = trimmed.match(/^(.*)<\s*([^<>\s]+@[^<>\s]+)\s*>$/)
    if (angle?.[2]) {
      const name = (angle[1] ?? '').trim().replace(/^"|"$/g, '').trim()
      return { address: angle[2].toLowerCase(), name: name || undefined }
    }
    // Bare "email@x.com" form.
    const bare = trimmed.match(/^([^<>\s]+@[^<>\s]+)$/)
    if (bare?.[1]) {
      return { address: bare[1].toLowerCase() }
    }
    return null
  }
  if (value && typeof value === 'object') {
    const obj = value as z.infer<typeof addressObjectSchema>
    const email = obj.email ?? obj.address
    if (email) return { address: email.toLowerCase(), name: obj.name ?? undefined }
  }
  return null
}

function parseAddressList(value: unknown): { address: string; name?: string }[] {
  if (value == null) return []
  const items = Array.isArray(value) ? value : [value]
  return items
    .map(parseSingleAddress)
    .filter((v): v is { address: string; name?: string } => v !== null)
}

/**
 * Normalize a validated Resend payload into a canonical `InboundEmail`.
 * Returns null when the message lacks a usable sender address.
 */
export function normalizeInboundEmail(payload: ResendWebhookPayload): InboundEmail | null {
  const data = payload.data
  const from = parseAddressList(data.from)[0]
  if (!from) return null

  const providerId =
    data.email_id ?? data.id ?? data.message_id ?? `${from.address}:${data.subject ?? ''}`

  const references = Array.isArray(data.references)
    ? data.references
    : typeof data.references === 'string'
      ? data.references.split(/\s+/).filter(Boolean)
      : []

  const attachments: InboundAttachment[] = (data.attachments ?? []).map((a) => ({
    filename: a.filename ?? 'attachment',
    contentType: a.contentType ?? a.content_type ?? 'application/octet-stream',
    size: a.size ?? 0,
    url: a.url ?? undefined,
    contentId: a.content_id ?? undefined,
  }))

  return {
    providerId,
    conversationId: data.conversation_id ?? data.conversationId ?? undefined,
    fromAddress: from.address,
    fromName: from.name,
    to: parseAddressList(data.to).map((a) => a.address),
    cc: parseAddressList(data.cc).map((a) => a.address),
    subject: data.subject?.trim() || '(no subject)',
    text: data.text ?? undefined,
    html: data.html ?? undefined,
    messageIdHeader: data.message_id ?? data.headers?.['message-id'] ?? undefined,
    inReplyTo: data.in_reply_to ?? data.headers?.['in-reply-to'] ?? undefined,
    references,
    attachments,
  }
}
