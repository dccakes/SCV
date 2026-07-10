/**
 * Email Domain - Service
 *
 * Owns the per-wedding inbound/outbound email lifecycle:
 *  - provisioning a unique `{bride}-and-{groom}@<domain>` address
 *  - resolving inbound recipients back to a wedding (webhook path, no session)
 *  - recording inbound + outbound messages into threaded conversations
 *  - building AI-triage context and persisting triage verdicts
 *  - couple-facing reads and reply sending (session-gated)
 */

import { TRPCError } from '@trpc/server'
import type { InboundAttachment } from '~/lib/email/resend-webhook'
import { forwardInboundEmail, sendWeddingEmail } from '~/lib/email/send'
import type { EmailTriageResult, TriageContext } from '~/lib/email/triage'
import {
  buildWeddingLocalPart,
  composeWeddingAddress,
  withLocalPartSuffix,
} from '~/lib/email/wedding-address'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { EmailRepository } from '~/server/domains/email/email.repository'
import type {
  EmailMessage,
  EmailMessageWithTriage,
  EmailThread,
  RecordInboundInput,
  RecordOutboundInput,
  WeddingEmailInbox,
} from '~/server/domains/email/email.types'

const MAX_LOCALPART_ATTEMPTS = 50
const DEFAULT_THREAD_LIMIT = 100

export class EmailService {
  constructor(private repo: EmailRepository) {}

  // ── Provisioning ──────────────────────────────────────────────────────────

  /** Idempotently provision (or return) the wedding's inbound address. */
  async provisionInbox(ctx: AuthzContext, weddingId: string): Promise<WeddingEmailInbox> {
    requirePermission(ctx, { wedding: ['read'] })
    return this.ensureInbox(weddingId)
  }

  /** Session-gated read of the wedding's inbox (null if not provisioned). */
  async getInbox(ctx: AuthzContext, weddingId: string): Promise<WeddingEmailInbox | null> {
    requirePermission(ctx, { wedding: ['read'] })
    return this.repo.findInboxByWedding(weddingId)
  }

  /**
   * Ensure an inbox exists for the wedding, generating a collision-free local
   * part from the couple's names. Safe to call without a session (used when
   * auto-provisioning). Not session-gated — callers that are user-facing should
   * go through {@link provisionInbox}.
   */
  async ensureInbox(weddingId: string): Promise<WeddingEmailInbox> {
    const existing = await this.repo.findInboxByWedding(weddingId)
    if (existing) return existing

    const wedding = await this.repo.findWeddingCore(weddingId)
    if (!wedding) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Wedding not found' })
    }

    const base = buildWeddingLocalPart(wedding.brideFirstName, wedding.groomFirstName)

    for (let attempt = 1; attempt <= MAX_LOCALPART_ATTEMPTS; attempt++) {
      const localPart = withLocalPartSuffix(base, attempt)
      if (await this.repo.localPartExists(localPart)) continue
      try {
        return await this.repo.createInbox({
          weddingId,
          localPart,
          address: composeWeddingAddress(localPart),
        })
      } catch {
        // Unique-constraint race (localPart or weddingId taken concurrently).
        const raced = await this.repo.findInboxByWedding(weddingId)
        if (raced) return raced
        // otherwise localPart lost the race → try the next suffix
      }
    }

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Could not allocate a unique wedding email address',
    })
  }

  // ── Inbound (webhook path) ──────────────────────────────────────────────────

  /** Resolve an inbound recipient address to its inbox. Not session-gated. */
  async resolveInboxByAddress(address: string): Promise<WeddingEmailInbox | null> {
    const inbox = await this.repo.findInboxByAddress(address)
    if (!inbox || inbox.disabledAt) return null
    return inbox
  }

  /**
   * Record an inbound message. Idempotent on provider id: a redelivered webhook
   * returns the already-stored message and `isNew: false`.
   */
  async recordInbound(
    input: RecordInboundInput
  ): Promise<{ thread: EmailThread; message: EmailMessage; isNew: boolean }> {
    const existing = await this.repo.findMessageByProviderId(input.providerId)
    if (existing) {
      const thread = await this.repo.findThreadById(existing.threadId)
      if (!thread) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Orphaned email message' })
      }
      return { thread, message: existing, isNew: false }
    }

    const thread = await this.repo.upsertThread({
      weddingId: input.weddingId,
      counterpartyEmail: input.fromAddress,
      counterpartyName: input.fromName,
      subject: input.subject,
      conversationId: input.conversationId,
    })

    const message = await this.repo.recordInbound({ ...input, threadId: thread.id })
    return { thread, message, isNew: true }
  }

  /** Build the wedding/vendor/guest context an AI triage pass needs. */
  async buildTriageContext(weddingId: string, fromAddress: string): Promise<TriageContext> {
    const [wedding, vendor, guest] = await Promise.all([
      this.repo.findWeddingCore(weddingId),
      this.repo.findVendorByContactEmail(weddingId, fromAddress),
      this.repo.findGuestByEmail(weddingId, fromAddress),
    ])
    return {
      wedding: {
        brideFirstName: wedding?.brideFirstName ?? '',
        groomFirstName: wedding?.groomFirstName ?? '',
      },
      knownVendorName: vendor?.name,
      knownGuestName: guest ? `${guest.firstName} ${guest.lastName}` : undefined,
    }
  }

  async persistTriage(
    messageId: string,
    weddingId: string,
    result: EmailTriageResult
  ): Promise<void> {
    await this.repo.persistTriage({ messageId, weddingId, result })
  }

  async applyThreadCategory(threadId: string, category: string): Promise<void> {
    await this.repo.setThreadCategory(threadId, category)
  }

  async linkThreadVendor(weddingId: string, threadId: string, fromAddress: string): Promise<void> {
    const vendor = await this.repo.findVendorByContactEmail(weddingId, fromAddress)
    if (vendor) await this.repo.setThreadVendor(threadId, vendor.id)
  }

  /** Record an outbound message that the handler sent (e.g. an auto-forward). */
  async recordOutbound(input: RecordOutboundInput): Promise<EmailMessage> {
    return this.repo.recordOutbound(input)
  }

  async getCoupleNotifyEmail(weddingId: string): Promise<string | null> {
    return this.repo.findCoupleNotifyEmail(weddingId)
  }

  async createTriageNotification(
    weddingId: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    await this.repo.createNotification({ weddingId, type: 'email_triage', payload })
  }

  /**
   * Forward an inbound message to the couple from the wedding inbox and record
   * the outbound copy on the same thread. Returns null when no couple email or
   * inbox is available.
   */
  async forwardInboundToCouple(args: {
    weddingId: string
    threadId: string
    inboxAddress: string
    original: EmailMessage
    note?: string
  }): Promise<EmailMessage | null> {
    const coupleEmail = await this.repo.findCoupleNotifyEmail(args.weddingId)
    if (!coupleEmail) return null

    const fromName = await this.weddingFromName(args.weddingId)
    const sent = await forwardInboundEmail({
      fromAddress: args.inboxAddress,
      fromName,
      to: coupleEmail,
      originalFrom: args.original.fromName
        ? `${args.original.fromName} <${args.original.fromAddress}>`
        : args.original.fromAddress,
      originalSubject: args.original.subject,
      originalText: args.original.text ?? undefined,
      attachments: args.original.attachments,
      note: args.note,
    })

    return this.repo.recordOutbound({
      weddingId: args.weddingId,
      threadId: args.threadId,
      fromAddress: args.inboxAddress,
      fromName,
      toAddresses: [coupleEmail],
      subject: `Fwd: ${args.original.subject}`,
      text: args.note,
      providerId: sent.id ?? undefined,
      attachments: args.original.attachments,
    })
  }

  // ── Couple-facing reads/writes (session-gated) ──────────────────────────────

  async listThreads(ctx: AuthzContext, weddingId: string): Promise<EmailThread[]> {
    requirePermission(ctx, { wedding: ['read'] })
    return this.repo.listThreads(weddingId, DEFAULT_THREAD_LIMIT)
  }

  async getThread(
    ctx: AuthzContext,
    weddingId: string,
    threadId: string
  ): Promise<{ thread: EmailThread; messages: EmailMessageWithTriage[] }> {
    requirePermission(ctx, { wedding: ['read'] })
    const thread = await this.repo.findThreadById(threadId)
    if (!thread || thread.weddingId !== weddingId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Thread not found' })
    }
    const messages = await this.repo.listMessagesWithTriage(threadId)
    return { thread, messages }
  }

  /** Send a reply from the wedding inbox on an existing thread. */
  async sendReply(
    ctx: AuthzContext,
    weddingId: string,
    input: { threadId: string; body: string; subject?: string; attachments?: InboundAttachment[] }
  ): Promise<EmailMessage> {
    requirePermission(ctx, { wedding: ['update'] })

    const thread = await this.repo.findThreadById(input.threadId)
    if (!thread || thread.weddingId !== weddingId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Thread not found' })
    }

    const inbox = await this.repo.findInboxByWedding(weddingId)
    if (!inbox || inbox.disabledAt) {
      throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Wedding inbox not provisioned' })
    }

    const messages = await this.repo.listMessages(input.threadId)
    const lastInbound = [...messages].reverse().find((m) => m.direction === 'inbound')
    const subject = input.subject ?? deriveReplySubject(thread.subject)
    const fromName = await this.weddingFromName(weddingId)

    const sent = await sendWeddingEmail({
      fromAddress: inbox.address,
      fromName,
      to: thread.counterpartyEmail,
      subject,
      text: input.body,
      inReplyTo: lastInbound?.messageIdHeader ?? undefined,
      references: lastInbound?.references,
      attachments: input.attachments,
    })

    return this.repo.recordOutbound({
      weddingId,
      threadId: input.threadId,
      fromAddress: inbox.address,
      fromName,
      toAddresses: [thread.counterpartyEmail],
      subject,
      text: input.body,
      providerId: sent.id ?? undefined,
      inReplyTo: lastInbound?.messageIdHeader ?? undefined,
      references: lastInbound?.references,
      attachments: input.attachments,
    })
  }

  /** Friendly "Jane & John's Wedding" display name for the from header. */
  async weddingFromName(weddingId: string): Promise<string | undefined> {
    const wedding = await this.repo.findWeddingCore(weddingId)
    if (!wedding) return undefined
    const names = [wedding.brideFirstName, wedding.groomFirstName].filter(Boolean)
    if (names.length === 0) return undefined
    return `${names.join(' & ')}'s Wedding`
  }
}

/** Prefix a subject with `Re:` unless it already has one. */
export function deriveReplySubject(subject: string): string {
  return /^re:/i.test(subject.trim()) ? subject : `Re: ${subject}`
}
