/**
 * Outbound email for wedding inboxes.
 *
 * Sends from a wedding's dedicated address (`{bride}-and-{groom}@<domain>`) via
 * Resend, with RFC-5322 threading headers so replies stay in the same
 * conversation. Also supports forwarding an inbound message (with attachments)
 * to the couple or a vendor.
 */

import 'server-only'

import { type CreateEmailOptions, Resend } from 'resend'
import { env } from '~/env'
import type { InboundAttachment } from '~/lib/email/resend-webhook'

let _resend: Resend | null = null
function getResend(): Resend {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  if (!_resend) {
    _resend = new Resend(env.RESEND_API_KEY)
  }
  return _resend
}

export interface SendWeddingEmailArgs {
  /** The wedding's own address, e.g. jane-and-john@w.oswp.carvallo.io */
  fromAddress: string
  /** Human-friendly from name, e.g. "Jane & John's Wedding" */
  fromName?: string
  to: string | string[]
  cc?: string[]
  subject: string
  text?: string
  html?: string
  /** Message-ID being replied to (sets In-Reply-To + References). */
  inReplyTo?: string
  references?: string[]
  attachments?: InboundAttachment[]
}

export interface SendWeddingEmailResult {
  id: string | null
}

function formatFrom(address: string, name?: string): string {
  return name ? `${name} <${address}>` : address
}

function buildHeaders(inReplyTo?: string, references?: string[]): Record<string, string> {
  const headers: Record<string, string> = {}
  if (inReplyTo) headers['In-Reply-To'] = inReplyTo
  const refs = [...(references ?? []), ...(inReplyTo ? [inReplyTo] : [])]
  if (refs.length > 0) headers.References = refs.join(' ')
  return headers
}

/**
 * Map inbound attachments to Resend attachment inputs. Attachments with a URL
 * are forwarded by reference (`path`); ones without are skipped (Resend needs
 * either content or a fetchable path).
 */
function toResendAttachments(attachments?: InboundAttachment[]) {
  return (attachments ?? [])
    .filter((a) => Boolean(a.url))
    .map((a) => ({ filename: a.filename, path: a.url as string }))
}

/** Send an email from a wedding inbox. */
export async function sendWeddingEmail(
  args: SendWeddingEmailArgs
): Promise<SendWeddingEmailResult> {
  const headers = buildHeaders(args.inReplyTo, args.references)
  const attachments = toResendAttachments(args.attachments)

  // Resend's typings are a discriminated union requiring exactly one content
  // shape; text/html are accepted together at runtime, so we assemble the
  // content half separately and cast when merging.
  const content = args.html ? { html: args.html, text: args.text } : { text: args.text ?? ' ' }

  const options = {
    from: formatFrom(args.fromAddress, args.fromName),
    to: args.to,
    cc: args.cc,
    subject: args.subject,
    replyTo: args.fromAddress,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    attachments: attachments.length > 0 ? attachments : undefined,
    ...content,
  } as CreateEmailOptions

  const { data, error } = await getResend().emails.send(options)

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`)
  }
  return { id: data?.id ?? null }
}

export interface ForwardInboundArgs {
  fromAddress: string
  fromName?: string
  to: string | string[]
  originalFrom: string
  originalSubject: string
  originalText?: string
  attachments?: InboundAttachment[]
  /** Optional note prepended to the forwarded body (e.g. from Etta triage). */
  note?: string
}

/** Forward an inbound message (with attachments) to the couple or a vendor. */
export async function forwardInboundEmail(
  args: ForwardInboundArgs
): Promise<SendWeddingEmailResult> {
  const forwardedHeader = [
    '---------- Forwarded message ----------',
    `From: ${args.originalFrom}`,
    `Subject: ${args.originalSubject}`,
    '',
    args.originalText ?? '(no text body)',
  ].join('\n')

  const body = args.note ? `${args.note}\n\n${forwardedHeader}` : forwardedHeader

  return sendWeddingEmail({
    fromAddress: args.fromAddress,
    fromName: args.fromName,
    to: args.to,
    subject: `Fwd: ${args.originalSubject}`,
    text: body,
    attachments: args.attachments,
  })
}
