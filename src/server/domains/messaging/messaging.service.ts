/**
 * Messaging Domain - Service
 */

import { randomBytes } from 'node:crypto'

import { TRPCError } from '@trpc/server'

import { env } from '~/env'

import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { MessagingRepository } from '~/server/domains/messaging/messaging.repository'
import type {
  BroadcastRecipient,
  Channel,
  ChatMessage,
  ChatRole,
  InboundWhatsAppResolution,
  MessagingIdentity,
  SessionOptions,
  WhatsAppConversation,
  WhatsAppNumber,
} from '~/server/domains/messaging/messaging.types'

const PAIRING_TOKEN_TTL_MS = 15 * 60_000

const defaultSessionOptions = (): SessionOptions => ({
  sessionGapMs: env.TELEGRAM_SESSION_GAP_MS ?? 30 * 60_000,
  maxMessages: env.TELEGRAM_SESSION_MAX_MESSAGES ?? 10,
  maxChars: env.TELEGRAM_SESSION_MAX_CHARS ?? 6_000,
})

export class MessagingService {
  constructor(private repo: MessagingRepository) {}

  async createPairingToken(
    ctx: AuthzContext,
    weddingId: string,
    channel: Channel
  ): Promise<{ token: string; deepLink: string; expiresAt: Date }> {
    requirePermission(ctx, { wedding: ['read'] })

    const username = env.TELEGRAM_BOT_USERNAME
    if (!username) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'TELEGRAM_BOT_USERNAME is not configured',
      })
    }

    const token = randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + PAIRING_TOKEN_TTL_MS)

    await this.repo.createPairingToken({
      weddingId,
      channel,
      createdByUserId: ctx.userId,
      token,
      expiresAt,
    })

    return { token, deepLink: `https://t.me/${username}?start=${token}`, expiresAt }
  }

  async consumePairingToken(input: {
    token: string
    channel: Channel
    externalChatId: string
    externalUserId?: string
    displayName?: string
  }): Promise<MessagingIdentity> {
    const result = await this.repo.consumeAndUpsert(input)
    if (!result.ok) {
      if (result.code === 'NOT_FOUND') {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pairing token not found' })
      }
      if (result.code === 'CONSUMED') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Pairing token already consumed' })
      }
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Pairing token expired' })
    }
    return result.identity
  }

  async findWeddingForChat(
    channel: Channel,
    externalChatId: string
  ): Promise<{ identity: MessagingIdentity; weddingId: string } | null> {
    const identity = await this.repo.findIdentityByChat(channel, externalChatId)
    if (!identity) return null
    return { identity, weddingId: identity.weddingId }
  }

  async appendMessage(input: {
    identityId: string
    weddingId: string
    role: ChatRole
    content: string
    attachmentUrl?: string
    attachmentName?: string
    externalMessageId?: string
  }): Promise<ChatMessage> {
    return this.repo.appendMessage(input)
  }

  async loadConversation(
    identityId: string,
    opts?: Partial<SessionOptions>
  ): Promise<ChatMessage[]> {
    const { sessionGapMs, maxMessages, maxChars } = { ...defaultSessionOptions(), ...opts }

    const recent = await this.repo.findRecentMessages(identityId, maxMessages + 1)
    if (recent.length === 0) return []

    const kept: ChatMessage[] = []
    let charCount = 0

    for (let i = 0; i < recent.length; i++) {
      const current = recent[i]
      if (!current) break

      if (kept.length > 0) {
        const previous = kept.at(-1)
        if (previous) {
          const gap = previous.createdAt.getTime() - current.createdAt.getTime()
          if (gap > sessionGapMs) break
        }
      }

      const nextCharCount = charCount + current.content.length
      if (kept.length >= maxMessages) break
      if (nextCharCount > maxChars && kept.length > 0) break

      kept.push(current)
      charCount = nextCharCount
    }

    return kept.reverse()
  }

  async findOrphanBlocks(
    identityId: string,
    opts?: Partial<SessionOptions>
  ): Promise<ChatMessage[][]> {
    const { sessionGapMs } = { ...defaultSessionOptions(), ...opts }
    const now = Date.now()

    const messages = await this.repo.findUnsummarizedMessages(identityId)
    if (messages.length === 0) return []

    const groups: ChatMessage[][] = []
    let current: ChatMessage[] = []

    for (const msg of messages) {
      if (current.length === 0) {
        current.push(msg)
        continue
      }
      const last = current.at(-1)
      if (!last) {
        current.push(msg)
        continue
      }
      const gap = msg.createdAt.getTime() - last.createdAt.getTime()
      if (gap <= sessionGapMs) {
        current.push(msg)
      } else {
        groups.push(current)
        current = [msg]
      }
    }
    if (current.length > 0) groups.push(current)

    return groups.filter((group) => {
      const newest = group.at(-1)
      if (!newest) return false
      return now - newest.createdAt.getTime() > sessionGapMs
    })
  }

  async markSummarized(messageIds: string[]): Promise<void> {
    return this.repo.markSummarized(messageIds)
  }

  async bumpPendingInvokeSeq(identityId: string): Promise<number> {
    return this.repo.bumpPendingInvokeSeq(identityId)
  }

  async getPendingInvokeSeq(identityId: string): Promise<number | null> {
    return this.repo.getPendingInvokeSeq(identityId)
  }

  async findIdentitiesWithUnsummarized(
    olderThanMs: number,
    maxIdentities: number
  ): Promise<MessagingIdentity[]> {
    return this.repo.findIdentitiesWithUnsummarized(olderThanMs, maxIdentities)
  }

  async resolveAuthzForIdentity(identity: MessagingIdentity): Promise<AuthzContext> {
    if (!identity.linkedByUserId) {
      throw new Error('Identity has no linked user — guest identities run without couple authz')
    }
    const membership = await this.repo.resolveOrgMembership(
      identity.linkedByUserId,
      identity.weddingId
    )
    return {
      userId: identity.linkedByUserId,
      activeOrganization: membership
        ? { organizationId: membership.organizationId, role: membership.role }
        : null,
    }
  }

  async revokeIdentity(ctx: AuthzContext, identityId: string, weddingId: string): Promise<void> {
    requirePermission(ctx, { wedding: ['update'] })
    const identity = await this.repo.findIdentityById(identityId)
    if (!identity || identity.weddingId !== weddingId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Identity not found' })
    }
    await this.repo.revokeIdentity(identityId)
  }

  async listLinkedChats(
    ctx: AuthzContext,
    weddingId: string
  ): Promise<Omit<MessagingIdentity, 'pendingInvokeSeq'>[]> {
    requirePermission(ctx, { wedding: ['read'] })
    const rows = await this.repo.findIdentitiesForWedding(weddingId)
    // Guest WhatsApp conversations surface via listHouseholdConversations, not here.
    return rows
      .filter((row) => row.channel === 'telegram')
      .map(({ pendingInvokeSeq: _pending, ...rest }) => rest)
  }

  // ── WhatsApp guest channel ─────────────────────────────────────────────────

  /**
   * Resolves an inbound WhatsApp message to a wedding + household-linked
   * identity. The receiving number identifies the wedding; the sender's phone
   * is matched against that wedding's guest list.
   */
  async resolveInboundWhatsApp(input: {
    serviceNumber: string
    attendeePhone: string
    profileName?: string
  }): Promise<InboundWhatsAppResolution> {
    const number = await this.repo.findWhatsAppNumberByPhone(input.serviceNumber)
    if (!number?.weddingId || number.status === 'disabled') {
      return { status: 'unknown_number' }
    }

    const guest = await this.repo.findGuestByPhone(number.weddingId, input.attendeePhone)
    if (!guest) {
      return { status: 'unknown_guest', weddingId: number.weddingId }
    }

    const identity = await this.repo.findOrCreateWhatsAppIdentity({
      weddingId: number.weddingId,
      serviceNumber: input.serviceNumber,
      externalChatId: input.attendeePhone,
      guestId: guest.id,
      householdId: guest.householdId,
      displayName: input.profileName ?? `${guest.firstName} ${guest.lastName}`.trim(),
    })

    return { status: 'ok', weddingId: number.weddingId, identity }
  }

  /** Internal accessor for application services that have already authorized the caller. */
  async getWeddingWhatsAppNumber(weddingId: string): Promise<WhatsAppNumber | null> {
    return this.repo.findWhatsAppNumberForWedding(weddingId)
  }

  /** Creates (or revives) the WhatsApp identity for a guest we message first. */
  async ensureWhatsAppIdentity(input: {
    weddingId: string
    serviceNumber: string
    phone: string
    guestId: number
    householdId: string
    displayName?: string
  }): Promise<MessagingIdentity> {
    return this.repo.findOrCreateWhatsAppIdentity({
      weddingId: input.weddingId,
      serviceNumber: input.serviceNumber,
      externalChatId: input.phone,
      guestId: input.guestId,
      householdId: input.householdId,
      displayName: input.displayName,
    })
  }

  /** Claims a dedicated WhatsApp number for the wedding (idempotent). */
  async assignWhatsAppNumber(ctx: AuthzContext, weddingId: string): Promise<WhatsAppNumber> {
    requirePermission(ctx, { wedding: ['update'] })

    const existing = await this.repo.findWhatsAppNumberForWedding(weddingId)
    if (existing) return existing

    const claimed = await this.repo.claimAvailableWhatsAppNumber(weddingId)
    if (!claimed) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'No WhatsApp numbers are available right now. Please contact support.',
      })
    }
    return claimed
  }

  async getWhatsAppStatus(
    ctx: AuthzContext,
    weddingId: string
  ): Promise<{ number: WhatsAppNumber | null; conversationCount: number }> {
    requirePermission(ctx, { wedding: ['read'] })
    const [number, conversations] = await Promise.all([
      this.repo.findWhatsAppNumberForWedding(weddingId),
      this.repo.findWhatsAppConversations(weddingId),
    ])
    return { number, conversationCount: conversations.length }
  }

  async listHouseholdConversations(
    ctx: AuthzContext,
    weddingId: string
  ): Promise<WhatsAppConversation[]> {
    requirePermission(ctx, { wedding: ['read'] })
    return this.repo.findWhatsAppConversations(weddingId)
  }

  async getConversationMessages(
    ctx: AuthzContext,
    weddingId: string,
    identityId: string
  ): Promise<ChatMessage[]> {
    requirePermission(ctx, { wedding: ['read'] })
    const identity = await this.repo.findIdentityById(identityId)
    if (!identity || identity.weddingId !== weddingId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' })
    }
    return this.repo.findMessagesForIdentity(identityId)
  }

  /**
   * One recipient per household: the household's existing WhatsApp
   * conversation if there is one, otherwise the primary contact with a phone,
   * otherwise any guest with a phone. Households with no reachable phone are
   * reported so the couple knows who a broadcast will miss.
   */
  async getBroadcastRecipients(weddingId: string): Promise<{
    recipients: BroadcastRecipient[]
    unreachableHouseholdIds: string[]
  }> {
    const [identities, households] = await Promise.all([
      this.repo.findActiveWhatsAppIdentities(weddingId),
      this.repo.findHouseholdsWithGuestPhones(weddingId),
    ])

    const identityByHousehold = new Map<string, MessagingIdentity>()
    for (const identity of identities) {
      if (identity.householdId && !identityByHousehold.has(identity.householdId)) {
        identityByHousehold.set(identity.householdId, identity)
      }
    }

    const recipients: BroadcastRecipient[] = []
    const unreachableHouseholdIds: string[] = []

    for (const household of households) {
      const identity = identityByHousehold.get(household.id)
      if (identity) {
        recipients.push({
          householdId: household.id,
          phone: identity.externalChatId,
          identityId: identity.id,
          guestId: identity.guestId,
          displayName: identity.displayName ?? '',
        })
        continue
      }

      const contact =
        household.guests.find((guest) => guest.isPrimaryContact && guest.phone) ??
        household.guests.find((guest) => guest.phone)
      if (!contact?.phone) {
        unreachableHouseholdIds.push(household.id)
        continue
      }

      recipients.push({
        householdId: household.id,
        phone: contact.phone,
        identityId: null,
        guestId: contact.id,
        displayName: `${contact.firstName} ${contact.lastName}`.trim(),
      })
    }

    return { recipients, unreachableHouseholdIds }
  }
}
