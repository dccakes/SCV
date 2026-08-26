/**
 * Messaging Domain - Repository
 */

import type { PrismaClient } from '@prisma/client'

import type {
  ChatMessage,
  ChatRole,
  GuestPhoneMatch,
  HouseholdWithGuestPhones,
  MessagingIdentity,
  MessagingPairingToken,
  WhatsAppConversation,
  WhatsAppNumber,
} from '~/server/domains/messaging/messaging.types'

const digitsOf = (value: string): string => value.replace(/\D/g, '')

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

  async findIdentityByChat(
    channel: string,
    externalChatId: string,
    serviceNumber = ''
  ): Promise<MessagingIdentity | null> {
    return this.db.messagingIdentity.findFirst({
      where: { channel, serviceNumber, externalChatId, revokedAt: null },
    })
  }

  async findIdentityById(id: string): Promise<MessagingIdentity | null> {
    return this.db.messagingIdentity.findUnique({ where: { id } })
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

  async resolveOrgMembership(
    userId: string,
    weddingId: string
  ): Promise<{ organizationId: string; role: string } | null> {
    const wedding = await this.db.wedding.findUnique({
      where: { id: weddingId },
      select: { organizationId: true },
    })
    if (!wedding?.organizationId) return null
    const member = await this.db.member.findFirst({
      where: { userId, organizationId: wedding.organizationId },
      select: { role: true, organizationId: true },
    })
    if (!member) return null
    return { organizationId: member.organizationId, role: member.role }
  }

  async findIdentitiesWithUnsummarized(
    olderThanMs: number,
    limitIdentities: number
  ): Promise<MessagingIdentity[]> {
    const threshold = new Date(Date.now() - olderThanMs)
    return this.db.messagingIdentity.findMany({
      where: {
        // Couple-memory summarisation is telegram-only: guest WhatsApp chats
        // have no linked couple user to run as, and shouldn't feed Etta's
        // couple memory wholesale.
        channel: 'telegram',
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
          channel_serviceNumber_externalChatId: {
            channel: input.channel,
            serviceNumber: '',
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

  // ── WhatsApp guest channel ─────────────────────────────────────────────────

  async findWhatsAppNumberByPhone(phoneNumber: string): Promise<WhatsAppNumber | null> {
    return this.db.whatsAppNumber.findUnique({ where: { phoneNumber } })
  }

  async findWhatsAppNumberForWedding(weddingId: string): Promise<WhatsAppNumber | null> {
    return this.db.whatsAppNumber.findUnique({ where: { weddingId } })
  }

  /**
   * Atomically claims the oldest available pool number for the wedding.
   * Returns null when the pool is exhausted (or the candidate was claimed by a
   * concurrent request — callers can simply retry).
   */
  async claimAvailableWhatsAppNumber(weddingId: string): Promise<WhatsAppNumber | null> {
    return this.db.$transaction(async (tx) => {
      const candidate = await tx.whatsAppNumber.findFirst({
        where: { status: 'available', weddingId: null },
        orderBy: { createdAt: 'asc' },
      })
      if (!candidate) return null

      const claimed = await tx.whatsAppNumber.updateMany({
        where: { id: candidate.id, weddingId: null },
        data: { weddingId, status: 'assigned', assignedAt: new Date() },
      })
      if (claimed.count === 0) return null

      return tx.whatsAppNumber.findUnique({ where: { id: candidate.id } })
    })
  }

  /**
   * Matches an inbound sender phone against the wedding's guest list. Numbers
   * are compared digits-only, tolerating a missing country code on the stored
   * guest phone. Exact matches win, then the household's primary contact.
   */
  async findGuestByPhone(weddingId: string, phone: string): Promise<GuestPhoneMatch | null> {
    const target = digitsOf(phone)
    if (!target) return null

    const guests = await this.db.guest.findMany({
      where: { weddingId, phone: { not: null } },
      select: {
        id: true,
        householdId: true,
        firstName: true,
        lastName: true,
        phone: true,
        isPrimaryContact: true,
      },
    })

    const matches = guests.filter((guest) => {
      const stored = digitsOf(guest.phone ?? '')
      if (!stored) return false
      if (stored === target) return true
      const shorter = stored.length < target.length ? stored : target
      const longer = stored.length < target.length ? target : stored
      return shorter.length >= 8 && longer.endsWith(shorter)
    })

    const best =
      matches.find((guest) => digitsOf(guest.phone ?? '') === target) ??
      matches.find((guest) => guest.isPrimaryContact) ??
      matches[0]
    if (!best) return null

    return {
      id: best.id,
      householdId: best.householdId,
      firstName: best.firstName,
      lastName: best.lastName,
    }
  }

  async findOrCreateWhatsAppIdentity(input: {
    weddingId: string
    serviceNumber: string
    externalChatId: string
    guestId: number
    householdId: string
    displayName?: string
  }): Promise<MessagingIdentity> {
    return this.db.messagingIdentity.upsert({
      where: {
        channel_serviceNumber_externalChatId: {
          channel: 'whatsapp',
          serviceNumber: input.serviceNumber,
          externalChatId: input.externalChatId,
        },
      },
      create: {
        weddingId: input.weddingId,
        channel: 'whatsapp',
        serviceNumber: input.serviceNumber,
        externalChatId: input.externalChatId,
        displayName: input.displayName,
        guestId: input.guestId,
        householdId: input.householdId,
      },
      update: {
        displayName: input.displayName,
        guestId: input.guestId,
        householdId: input.householdId,
        revokedAt: null,
      },
    })
  }

  async findWhatsAppConversations(weddingId: string): Promise<WhatsAppConversation[]> {
    return this.db.messagingIdentity.findMany({
      where: { weddingId, channel: 'whatsapp', revokedAt: null },
      include: {
        household: {
          select: {
            id: true,
            guests: {
              select: { firstName: true, lastName: true, isPrimaryContact: true },
              orderBy: { id: 'asc' },
            },
          },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { linkedAt: 'desc' },
    })
  }

  async findActiveWhatsAppIdentities(weddingId: string): Promise<MessagingIdentity[]> {
    return this.db.messagingIdentity.findMany({
      where: { weddingId, channel: 'whatsapp', revokedAt: null },
      orderBy: { linkedAt: 'asc' },
    })
  }

  async findMessagesForIdentity(identityId: string, limit = 200): Promise<ChatMessage[]> {
    const messages = await this.db.chatMessage.findMany({
      where: { identityId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return messages.reverse()
  }

  async findHouseholdsWithGuestPhones(weddingId: string): Promise<HouseholdWithGuestPhones[]> {
    return this.db.household.findMany({
      where: { weddingId },
      select: {
        id: true,
        guests: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            isPrimaryContact: true,
          },
          orderBy: { id: 'asc' },
        },
      },
    })
  }
}
