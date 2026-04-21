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
  Channel,
  ChatMessage,
  ChatRole,
  MessagingIdentity,
  SessionOptions,
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
    return rows.map(({ pendingInvokeSeq: _pending, ...rest }) => rest)
  }
}
