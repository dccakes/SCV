/**
 * Messaging Domain - Repository
 */

import type { PrismaClient } from '@prisma/client'

import type {
  ChatMessage,
  ChatRole,
  MessagingIdentity,
  MessagingPairingToken,
} from '~/server/domains/messaging/messaging.types'

export class MessagingRepository {
  constructor(private db: PrismaClient) {}

  async createPairingToken(data: {
    weddingId: string
    channel: string
    createdByUserId: string
    token: string
    expiresAt: Date
  }): Promise<MessagingPairingToken> {
    return this.db.messagingPairingToken.create({ data })
  }

  async findPairingToken(token: string): Promise<MessagingPairingToken | null> {
    return this.db.messagingPairingToken.findUnique({ where: { token } })
  }

  async consumePairingToken(token: string, externalChatId: string): Promise<number> {
    const result = await this.db.messagingPairingToken.updateMany({
      where: { token, consumedAt: null, expiresAt: { gt: new Date() } },
      data: { consumedAt: new Date(), consumedChatId: externalChatId },
    })
    return result.count
  }

  async upsertIdentity(data: {
    weddingId: string
    channel: string
    externalChatId: string
    externalUserId?: string
    displayName?: string
    linkedByUserId: string
  }): Promise<MessagingIdentity> {
    return this.db.messagingIdentity.upsert({
      where: {
        channel_externalChatId: {
          channel: data.channel,
          externalChatId: data.externalChatId,
        },
      },
      create: data,
      update: {
        linkedByUserId: data.linkedByUserId,
        externalUserId: data.externalUserId,
        displayName: data.displayName,
        revokedAt: null,
      },
    })
  }

  async findIdentityByChat(
    channel: string,
    externalChatId: string
  ): Promise<MessagingIdentity | null> {
    return this.db.messagingIdentity.findFirst({
      where: { channel, externalChatId, revokedAt: null },
      include: { wedding: true },
    })
  }

  async findIdentitiesForWedding(weddingId: string): Promise<MessagingIdentity[]> {
    return this.db.messagingIdentity.findMany({
      where: { weddingId, revokedAt: null },
      orderBy: { linkedAt: 'desc' },
    })
  }

  async revokeIdentity(identityId: string): Promise<MessagingIdentity> {
    return this.db.messagingIdentity.update({
      where: { id: identityId },
      data: { revokedAt: new Date() },
    })
  }

  async appendMessage(data: {
    identityId: string
    weddingId: string
    role: ChatRole
    content: string
    attachmentUrl?: string
    attachmentName?: string
    externalMessageId?: string
  }): Promise<ChatMessage> {
    if (data.externalMessageId) {
      return this.db.chatMessage.upsert({
        where: {
          identityId_externalMessageId: {
            identityId: data.identityId,
            externalMessageId: data.externalMessageId,
          },
        },
        create: data,
        update: {},
      })
    }
    return this.db.chatMessage.create({ data })
  }

  async findRecentMessages(identityId: string, limit: number): Promise<ChatMessage[]> {
    return this.db.chatMessage.findMany({
      where: { identityId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async findUnsummarizedMessages(identityId: string): Promise<ChatMessage[]> {
    return this.db.chatMessage.findMany({
      where: { identityId, summarizedAt: null },
      orderBy: { createdAt: 'asc' },
    })
  }

  async markSummarized(messageIds: string[]): Promise<void> {
    if (messageIds.length === 0) return
    await this.db.chatMessage.updateMany({
      where: { id: { in: messageIds } },
      data: { summarizedAt: new Date() },
    })
  }

  async bumpPendingInvokeSeq(identityId: string): Promise<number> {
    const updated = await this.db.messagingIdentity.update({
      where: { id: identityId },
      data: { pendingInvokeSeq: { increment: 1 } },
      select: { pendingInvokeSeq: true },
    })
    return updated.pendingInvokeSeq
  }

  async getPendingInvokeSeq(identityId: string): Promise<number | null> {
    const row = await this.db.messagingIdentity.findUnique({
      where: { id: identityId },
      select: { pendingInvokeSeq: true },
    })
    return row?.pendingInvokeSeq ?? null
  }

  async findIdentitiesWithUnsummarized(
    olderThanMs: number,
    limitIdentities: number
  ): Promise<MessagingIdentity[]> {
    const threshold = new Date(Date.now() - olderThanMs)
    return this.db.messagingIdentity.findMany({
      where: {
        revokedAt: null,
        messages: {
          some: { summarizedAt: null, createdAt: { lt: threshold } },
        },
      },
      take: limitIdentities,
    })
  }

  async consumeAndUpsert(input: {
    token: string
    channel: string
    externalChatId: string
    externalUserId?: string
    displayName?: string
  }): Promise<
    | { ok: true; identity: MessagingIdentity }
    | { ok: false; code: 'NOT_FOUND' | 'CONSUMED' | 'EXPIRED' }
  > {
    return this.db.$transaction(async (tx) => {
      const row = await tx.messagingPairingToken.findUnique({ where: { token: input.token } })
      if (!row) return { ok: false as const, code: 'NOT_FOUND' as const }
      if (row.consumedAt) return { ok: false as const, code: 'CONSUMED' as const }
      if (row.expiresAt.getTime() <= Date.now())
        return { ok: false as const, code: 'EXPIRED' as const }

      const identity = await tx.messagingIdentity.upsert({
        where: {
          channel_externalChatId: {
            channel: input.channel,
            externalChatId: input.externalChatId,
          },
        },
        create: {
          weddingId: row.weddingId,
          channel: input.channel,
          externalChatId: input.externalChatId,
          externalUserId: input.externalUserId,
          displayName: input.displayName,
          linkedByUserId: row.createdByUserId,
        },
        update: {
          linkedByUserId: row.createdByUserId,
          externalUserId: input.externalUserId,
          displayName: input.displayName,
          revokedAt: null,
        },
      })

      await tx.messagingPairingToken.update({
        where: { token: input.token },
        data: { consumedAt: new Date(), consumedChatId: input.externalChatId },
      })

      return { ok: true as const, identity }
    })
  }
}
