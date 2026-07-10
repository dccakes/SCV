/**
 * Email Domain - Repository
 */

import type { PrismaClient } from '@prisma/client'
import type { InboundAttachment } from '~/lib/email/resend-webhook'
import type {
  EmailMessage,
  EmailMessageTriage,
  EmailMessageWithTriage,
  EmailThread,
  PersistTriageInput,
  RecordInboundInput,
  RecordOutboundInput,
  WeddingEmailInbox,
} from '~/server/domains/email/email.types'

type PrismaEmailMessage = {
  id: string
  threadId: string
  weddingId: string
  direction: string
  fromAddress: string
  fromName: string | null
  toAddresses: string[]
  ccAddresses: string[]
  subject: string
  text: string | null
  html: string | null
  providerId: string | null
  messageIdHeader: string | null
  inReplyTo: string | null
  references: string[]
  attachments: unknown
  createdAt: Date
}

function mapMessage(row: PrismaEmailMessage): EmailMessage {
  return {
    ...row,
    direction: row.direction as EmailMessage['direction'],
    attachments: (Array.isArray(row.attachments) ? row.attachments : []) as InboundAttachment[],
  }
}

export class EmailRepository {
  constructor(private db: PrismaClient) {}

  // ── Inbox ──────────────────────────────────────────────────────────────────

  async findInboxByWedding(weddingId: string): Promise<WeddingEmailInbox | null> {
    return this.db.weddingEmailInbox.findUnique({ where: { weddingId } })
  }

  async findInboxByAddress(address: string): Promise<WeddingEmailInbox | null> {
    return this.db.weddingEmailInbox.findUnique({ where: { address: address.toLowerCase() } })
  }

  async localPartExists(localPart: string): Promise<boolean> {
    const row = await this.db.weddingEmailInbox.findUnique({
      where: { localPart },
      select: { id: true },
    })
    return row !== null
  }

  async createInbox(data: {
    weddingId: string
    localPart: string
    address: string
  }): Promise<WeddingEmailInbox> {
    return this.db.weddingEmailInbox.create({ data })
  }

  // ── Threads ──────────────────────────────────────────────────────────────────

  async findThreadById(threadId: string): Promise<EmailThread | null> {
    return this.db.emailThread.findUnique({ where: { id: threadId } })
  }

  async findThreadByConversationId(
    weddingId: string,
    conversationId: string
  ): Promise<EmailThread | null> {
    return this.db.emailThread.findUnique({
      where: {
        weddingId_providerConversationId: {
          weddingId,
          providerConversationId: conversationId,
        },
      },
    })
  }

  /** Group by Resend conversation id when present, else by counterparty email. */
  async upsertThread(input: {
    weddingId: string
    counterpartyEmail: string
    counterpartyName?: string
    subject: string
    conversationId?: string
  }): Promise<EmailThread> {
    if (input.conversationId) {
      return this.db.emailThread.upsert({
        where: {
          weddingId_providerConversationId: {
            weddingId: input.weddingId,
            providerConversationId: input.conversationId,
          },
        },
        create: {
          weddingId: input.weddingId,
          counterpartyEmail: input.counterpartyEmail,
          counterpartyName: input.counterpartyName,
          providerConversationId: input.conversationId,
          subject: input.subject,
          lastMessageAt: new Date(),
        },
        update: {
          lastMessageAt: new Date(),
          ...(input.counterpartyName ? { counterpartyName: input.counterpartyName } : {}),
        },
      })
    }

    return this.db.emailThread.upsert({
      where: {
        weddingId_counterpartyEmail: {
          weddingId: input.weddingId,
          counterpartyEmail: input.counterpartyEmail,
        },
      },
      create: {
        weddingId: input.weddingId,
        counterpartyEmail: input.counterpartyEmail,
        counterpartyName: input.counterpartyName,
        subject: input.subject,
        lastMessageAt: new Date(),
      },
      update: {
        lastMessageAt: new Date(),
        // Keep the latest counterparty name if we learn one.
        ...(input.counterpartyName ? { counterpartyName: input.counterpartyName } : {}),
      },
    })
  }

  async listThreads(weddingId: string, limit: number): Promise<EmailThread[]> {
    return this.db.emailThread.findMany({
      where: { weddingId },
      orderBy: { lastMessageAt: 'desc' },
      take: limit,
    })
  }

  async setThreadCategory(threadId: string, category: string): Promise<void> {
    await this.db.emailThread.update({ where: { id: threadId }, data: { category } })
  }

  async setThreadVendor(threadId: string, vendorId: string): Promise<void> {
    await this.db.emailThread.update({ where: { id: threadId }, data: { vendorId } })
  }

  async setThreadStatus(threadId: string, status: string): Promise<void> {
    await this.db.emailThread.update({ where: { id: threadId }, data: { status } })
  }

  // ── Messages ─────────────────────────────────────────────────────────────────

  async findMessageByProviderId(providerId: string): Promise<EmailMessage | null> {
    const row = await this.db.emailMessage.findUnique({ where: { providerId } })
    return row ? mapMessage(row) : null
  }

  async recordInbound(input: RecordInboundInput & { threadId: string }): Promise<EmailMessage> {
    const row = await this.db.emailMessage.create({
      data: {
        threadId: input.threadId,
        weddingId: input.weddingId,
        direction: 'inbound',
        fromAddress: input.fromAddress,
        fromName: input.fromName,
        toAddresses: input.toAddresses,
        ccAddresses: input.ccAddresses,
        subject: input.subject,
        text: input.text,
        html: input.html,
        providerId: input.providerId,
        messageIdHeader: input.messageIdHeader,
        inReplyTo: input.inReplyTo,
        references: input.references,
        attachments: input.attachments as unknown as object,
      },
    })
    return mapMessage(row)
  }

  async recordOutbound(input: RecordOutboundInput): Promise<EmailMessage> {
    const row = await this.db.emailMessage.create({
      data: {
        threadId: input.threadId,
        weddingId: input.weddingId,
        direction: 'outbound',
        fromAddress: input.fromAddress,
        fromName: input.fromName,
        toAddresses: input.toAddresses,
        ccAddresses: input.ccAddresses ?? [],
        subject: input.subject,
        text: input.text,
        html: input.html,
        providerId: input.providerId,
        inReplyTo: input.inReplyTo,
        references: input.references ?? [],
        attachments: (input.attachments ?? []) as unknown as object,
      },
    })
    await this.db.emailThread.update({
      where: { id: input.threadId },
      data: { lastMessageAt: new Date() },
    })
    return mapMessage(row)
  }

  async listMessages(threadId: string): Promise<EmailMessage[]> {
    const rows = await this.db.emailMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
    })
    return rows.map(mapMessage)
  }

  async listMessagesWithTriage(threadId: string): Promise<EmailMessageWithTriage[]> {
    const rows = await this.db.emailMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      include: { triage: true },
    })
    return rows.map((row) => ({
      ...mapMessage(row),
      triage: row.triage
        ? {
            category: row.triage.category,
            intent: row.triage.intent,
            summary: row.triage.summary,
            priority: row.triage.priority,
            suggestedActions: (Array.isArray(row.triage.suggestedActions)
              ? row.triage.suggestedActions
              : []) as EmailMessageTriage['suggestedActions'],
            confidence: row.triage.confidence,
            status: row.triage.status,
          }
        : null,
    }))
  }

  // ── Triage ───────────────────────────────────────────────────────────────────

  async persistTriage(input: PersistTriageInput): Promise<void> {
    const { result } = input
    await this.db.emailTriage.upsert({
      where: { messageId: input.messageId },
      create: {
        messageId: input.messageId,
        weddingId: input.weddingId,
        category: result.category,
        intent: result.intent,
        summary: result.summary,
        priority: result.priority,
        suggestedActions: result.suggestedActions as unknown as object,
        confidence: result.confidence,
      },
      update: {
        category: result.category,
        intent: result.intent,
        summary: result.summary,
        priority: result.priority,
        suggestedActions: result.suggestedActions as unknown as object,
        confidence: result.confidence,
      },
    })
  }

  // ── Cross-domain read-only lookups (triage context) ─────────────────────────

  async findVendorByContactEmail(
    weddingId: string,
    email: string
  ): Promise<{ id: string; name: string } | null> {
    return this.db.vendor.findFirst({
      where: { weddingId, contactEmail: { equals: email, mode: 'insensitive' } },
      select: { id: true, name: true },
    })
  }

  async findGuestByEmail(
    weddingId: string,
    email: string
  ): Promise<{ firstName: string; lastName: string } | null> {
    return this.db.guest.findFirst({
      where: { weddingId, email: { equals: email, mode: 'insensitive' } },
      select: { firstName: true, lastName: true },
    })
  }

  async findWeddingCore(
    weddingId: string
  ): Promise<{ brideFirstName: string; groomFirstName: string } | null> {
    return this.db.wedding.findUnique({
      where: { id: weddingId },
      select: { brideFirstName: true, groomFirstName: true },
    })
  }

  /** Email of the primary (creator) user managing the wedding, for forwards. */
  async findCoupleNotifyEmail(weddingId: string): Promise<string | null> {
    const link = await this.db.userWedding.findFirst({
      where: { weddingId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      select: { user: { select: { email: true } } },
    })
    return link?.user.email ?? null
  }

  async createNotification(data: {
    weddingId: string
    type: string
    payload: Record<string, unknown>
  }): Promise<void> {
    await this.db.notification.create({
      data: {
        weddingId: data.weddingId,
        type: data.type,
        payload: data.payload as unknown as object,
      },
    })
  }
}
