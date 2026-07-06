/**
 * Tests for Messaging Domain Service
 */

import { TRPCError } from '@trpc/server'

jest.mock('~/env', () => ({
  env: new Proxy({} as Record<string, string | undefined>, {
    get: (_t, prop: string) => process.env[prop],
  }),
}))

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))

jest.mock('~/server/domains/messaging/messaging.repository')

jest.mock('~/server/infrastructure/database', () => ({
  db: {
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
  },
}))

import { requirePermission } from '~/server/authz/permission-checker'
// @ts-expect-error - Importing mock functions from mocked module
import {
  MessagingRepository,
  mockAppendMessage,
  mockBumpPendingInvokeSeq,
  mockChatMessage,
  mockConsumeAndUpsert,
  mockCreatePairingToken,
  mockFindIdentitiesForWedding,
  mockFindIdentityByChat,
  mockFindIdentityById,
  mockFindRecentMessages,
  mockFindUnsummarizedMessages,
  mockGetPendingInvokeSeq,
  mockIdentity,
  mockMarkSummarized,
  mockPairingToken,
  mockRevokeIdentity,
  resetMocks,
} from '~/server/domains/messaging/messaging.repository'
import { MessagingService } from '~/server/domains/messaging/messaging.service'

const mockRequirePermission = requirePermission as jest.Mock
const mockCreatePairingTokenFn = mockCreatePairingToken as jest.Mock
const mockConsumeAndUpsertFn = mockConsumeAndUpsert as jest.Mock
const mockFindIdentityByChatFn = mockFindIdentityByChat as jest.Mock
const mockFindIdentitiesForWeddingFn = mockFindIdentitiesForWedding as jest.Mock
const mockFindIdentityByIdFn = mockFindIdentityById as jest.Mock
const mockRevokeIdentityFn = mockRevokeIdentity as jest.Mock
const mockAppendMessageFn = mockAppendMessage as jest.Mock
const mockFindRecentMessagesFn = mockFindRecentMessages as jest.Mock
const mockFindUnsummarizedMessagesFn = mockFindUnsummarizedMessages as jest.Mock
const mockMarkSummarizedFn = mockMarkSummarized as jest.Mock
const mockBumpPendingInvokeSeqFn = mockBumpPendingInvokeSeq as jest.Mock
const mockGetPendingInvokeSeqFn = mockGetPendingInvokeSeq as jest.Mock

const ORIGINAL_ENV = process.env

describe('MessagingService', () => {
  let service: MessagingService
  const ctx = { userId: 'user-1', activeOrganization: null }

  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-21T12:00:00Z'))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    resetMocks()
    mockRequirePermission.mockReset()
    mockRequirePermission.mockReturnValue({ organizationId: 'org-1', role: 'admin' })
    process.env = { ...ORIGINAL_ENV, TELEGRAM_BOT_USERNAME: 'EttaBot' }
    const repo = new MessagingRepository({})
    service = new MessagingService(repo)
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  // ─── createPairingToken ────────────────────────────────────────────────────

  describe('createPairingToken', () => {
    it('returns a token, deep link, and 15-minute expiry', async () => {
      mockCreatePairingTokenFn.mockImplementation(async (args) => ({
        ...mockPairingToken,
        ...args,
      }))

      const result = await service.createPairingToken(ctx, 'wedding-123', 'telegram')

      expect(result.token).toEqual(expect.any(String))
      expect(result.token.length).toBeGreaterThan(20)
      expect(result.deepLink).toBe(`https://t.me/EttaBot?start=${result.token}`)
      const expectedExpiry = new Date('2026-04-21T12:15:00Z')
      expect(result.expiresAt.getTime()).toBe(expectedExpiry.getTime())

      expect(mockCreatePairingTokenFn).toHaveBeenCalledWith(
        expect.objectContaining({
          weddingId: 'wedding-123',
          channel: 'telegram',
          createdByUserId: 'user-1',
          token: result.token,
          expiresAt: expectedExpiry,
        })
      )
    })

    it('throws INTERNAL_SERVER_ERROR when TELEGRAM_BOT_USERNAME is not set', async () => {
      delete process.env.TELEGRAM_BOT_USERNAME

      await expect(
        service.createPairingToken(ctx, 'wedding-123', 'telegram')
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
      })
    })

    it('checks permission via requirePermission', async () => {
      mockCreatePairingTokenFn.mockResolvedValue(mockPairingToken)
      await service.createPairingToken(ctx, 'wedding-123', 'telegram')
      expect(mockRequirePermission).toHaveBeenCalledWith(ctx, { wedding: ['read'] })
    })
  })

  // ─── consumePairingToken ───────────────────────────────────────────────────

  describe('consumePairingToken', () => {
    it('upserts identity and returns it on happy path', async () => {
      mockConsumeAndUpsertFn.mockResolvedValue({ ok: true, identity: mockIdentity })

      const result = await service.consumePairingToken({
        token: 'token-abc',
        channel: 'telegram',
        externalChatId: 'chat-99',
        externalUserId: 'tg-user-1',
        displayName: 'Alice',
      })

      expect(result).toEqual(mockIdentity)
      expect(mockConsumeAndUpsertFn).toHaveBeenCalledWith({
        token: 'token-abc',
        channel: 'telegram',
        externalChatId: 'chat-99',
        externalUserId: 'tg-user-1',
        displayName: 'Alice',
      })
    })

    it('rejects expired token', async () => {
      mockConsumeAndUpsertFn.mockResolvedValue({ ok: false, code: 'EXPIRED' })

      await expect(
        service.consumePairingToken({
          token: 'token-abc',
          channel: 'telegram',
          externalChatId: 'chat-99',
        })
      ).rejects.toBeInstanceOf(TRPCError)
    })

    it('rejects an already-consumed token', async () => {
      mockConsumeAndUpsertFn.mockResolvedValue({ ok: false, code: 'CONSUMED' })

      await expect(
        service.consumePairingToken({
          token: 'token-abc',
          channel: 'telegram',
          externalChatId: 'chat-99',
        })
      ).rejects.toBeInstanceOf(TRPCError)
    })

    it('rejects an unknown token', async () => {
      mockConsumeAndUpsertFn.mockResolvedValue({ ok: false, code: 'NOT_FOUND' })

      await expect(
        service.consumePairingToken({
          token: 'token-abc',
          channel: 'telegram',
          externalChatId: 'chat-99',
        })
      ).rejects.toBeInstanceOf(TRPCError)
    })
  })

  // ─── loadConversation ──────────────────────────────────────────────────────

  describe('loadConversation', () => {
    const identityId = 'identity-1'
    const baseTime = new Date('2026-04-21T12:00:00Z').getTime()

    // Build a message helper — creates msgs newest-first at spacing `spacingMs`
    const buildMessages = (count: number, spacingMs: number, contentLength = 10) =>
      Array.from({ length: count }, (_, i) => ({
        ...mockChatMessage,
        id: `m-${i}`,
        createdAt: new Date(baseTime - i * spacingMs),
        content: 'x'.repeat(contentLength),
      }))

    it('returns empty array when no messages', async () => {
      mockFindRecentMessagesFn.mockResolvedValue([])

      const result = await service.loadConversation(identityId)

      expect(result).toEqual([])
    })

    it('respects maxMessages cap (15 msgs, limit 10 -> 10 returned oldest→newest)', async () => {
      // All messages 1 minute apart -> within default 30m gap
      const msgs = buildMessages(15, 60_000, 10)
      mockFindRecentMessagesFn.mockResolvedValue(msgs)

      const result = await service.loadConversation(identityId, {
        sessionGapMs: 30 * 60_000,
        maxMessages: 10,
        maxChars: 1_000_000,
      })

      expect(result).toHaveLength(10)
      const newestMessage = result.at(-1)
      expect(newestMessage).toBeDefined()
      if (!newestMessage) {
        throw new Error('Expected newest message to be present')
      }
      // oldest first
      expect(result[0]?.createdAt.getTime()).toBeLessThan(newestMessage.createdAt.getTime())
      // newest message is the first element of the input (most recent)
      expect(newestMessage.id).toBe('m-0')
    })

    it('respects maxChars cap', async () => {
      // 5 messages of 100 chars each, 1min apart
      const msgs = buildMessages(5, 60_000, 100)
      mockFindRecentMessagesFn.mockResolvedValue(msgs)

      // maxChars 250 -> only 2 messages fit (200 chars), the 3rd would push over
      const result = await service.loadConversation(identityId, {
        sessionGapMs: 30 * 60_000,
        maxMessages: 100,
        maxChars: 250,
      })

      expect(result).toHaveLength(2)
    })

    it('stops traversal at a gap greater than sessionGapMs', async () => {
      // 3 recent messages 1min apart, then a 60-min gap, then 3 older
      const recent = buildMessages(3, 60_000, 10)
      const olderStart = new Date(baseTime - 3 * 60_000 - 60 * 60_000)
      const older = Array.from({ length: 3 }, (_, i) => ({
        ...mockChatMessage,
        id: `o-${i}`,
        createdAt: new Date(olderStart.getTime() - i * 60_000),
        content: 'y'.repeat(10),
      }))
      mockFindRecentMessagesFn.mockResolvedValue([...recent, ...older])

      const result = await service.loadConversation(identityId, {
        sessionGapMs: 30 * 60_000,
        maxMessages: 100,
        maxChars: 1_000_000,
      })

      expect(result).toHaveLength(3)
      expect(result.map((m) => m.id).sort()).toEqual(['m-0', 'm-1', 'm-2'])
    })

    it('returns messages in oldest→newest order', async () => {
      const msgs = buildMessages(4, 60_000, 10)
      mockFindRecentMessagesFn.mockResolvedValue(msgs)

      const result = await service.loadConversation(identityId)

      for (let i = 1; i < result.length; i++) {
        const currentMessage = result[i]
        const previousMessage = result[i - 1]

        expect(currentMessage).toBeDefined()
        expect(previousMessage).toBeDefined()

        if (!currentMessage || !previousMessage) {
          throw new Error(`Expected messages at indexes ${i - 1} and ${i}`)
        }
        expect(currentMessage.createdAt.getTime()).toBeGreaterThanOrEqual(
          previousMessage.createdAt.getTime()
        )
      }
    })
  })

  // ─── findWeddingForChat ────────────────────────────────────────────────────

  describe('findWeddingForChat', () => {
    it('returns null for unlinked chat', async () => {
      mockFindIdentityByChatFn.mockResolvedValue(null)
      const result = await service.findWeddingForChat('telegram', 'chat-unknown')
      expect(result).toBeNull()
    })

    it('returns identity + weddingId when linked', async () => {
      mockFindIdentityByChatFn.mockResolvedValue(mockIdentity)
      const result = await service.findWeddingForChat('telegram', mockIdentity.externalChatId)
      expect(result).toEqual({ identity: mockIdentity, weddingId: mockIdentity.weddingId })
    })

    it('returns null for revoked identity (repo filters them out)', async () => {
      mockFindIdentityByChatFn.mockResolvedValue(null)
      const result = await service.findWeddingForChat('telegram', mockIdentity.externalChatId)
      expect(result).toBeNull()
    })
  })

  // ─── findOrphanBlocks ──────────────────────────────────────────────────────

  describe('findOrphanBlocks', () => {
    const identityId = 'identity-1'
    const now = new Date('2026-04-21T12:00:00Z').getTime()

    it('groups un-summarized messages whose internal gaps are ≤ sessionGapMs and whose newest is older than now - sessionGapMs', async () => {
      // Three messages in group A, 1 min apart, newest 60 minutes ago (stale)
      // Then a 60-min gap
      // Two messages in group B, 1 min apart, newest 5 minutes ago (too recent, skip)
      const groupANewest = new Date(now - 60 * 60_000)
      const groupA = [
        { ...mockChatMessage, id: 'a-2', createdAt: groupANewest },
        {
          ...mockChatMessage,
          id: 'a-1',
          createdAt: new Date(groupANewest.getTime() - 60_000),
        },
        {
          ...mockChatMessage,
          id: 'a-0',
          createdAt: new Date(groupANewest.getTime() - 2 * 60_000),
        },
      ]

      const groupBNewest = new Date(now - 5 * 60_000)
      const groupB = [
        { ...mockChatMessage, id: 'b-1', createdAt: groupBNewest },
        {
          ...mockChatMessage,
          id: 'b-0',
          createdAt: new Date(groupBNewest.getTime() - 60_000),
        },
      ]

      // findUnsummarizedMessages returns oldest → newest
      const all = [...groupA.slice().reverse(), ...groupB.slice().reverse()]
      mockFindUnsummarizedMessagesFn.mockResolvedValue(all)

      const result = await service.findOrphanBlocks(identityId, {
        sessionGapMs: 30 * 60_000,
        maxMessages: 100,
        maxChars: 1_000_000,
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.map((m) => m.id)).toEqual(['a-0', 'a-1', 'a-2'])
    })

    it('returns empty array when no un-summarized messages', async () => {
      mockFindUnsummarizedMessagesFn.mockResolvedValue([])
      const result = await service.findOrphanBlocks(identityId)
      expect(result).toEqual([])
    })
  })

  // ─── revokeIdentity ────────────────────────────────────────────────────────

  describe('revokeIdentity', () => {
    it('calls permission check and repo method', async () => {
      mockFindIdentityByIdFn.mockResolvedValue({ ...mockIdentity, weddingId: 'wedding-123' })
      mockRevokeIdentityFn.mockResolvedValue(undefined)

      await service.revokeIdentity(ctx, 'identity-1', 'wedding-123')

      expect(mockRequirePermission).toHaveBeenCalledWith(ctx, { wedding: ['update'] })
      expect(mockFindIdentityByIdFn).toHaveBeenCalledWith('identity-1')
      expect(mockRevokeIdentityFn).toHaveBeenCalledWith('identity-1')
    })

    it('throws NOT_FOUND when identity belongs to a different wedding', async () => {
      mockFindIdentityByIdFn.mockResolvedValue({ ...mockIdentity, weddingId: 'other-wedding' })

      await expect(service.revokeIdentity(ctx, 'identity-1', 'wedding-123')).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
      expect(mockRevokeIdentityFn).not.toHaveBeenCalled()
    })

    it('throws NOT_FOUND when identity does not exist', async () => {
      mockFindIdentityByIdFn.mockResolvedValue(null)

      await expect(service.revokeIdentity(ctx, 'identity-1', 'wedding-123')).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
      expect(mockRevokeIdentityFn).not.toHaveBeenCalled()
    })
  })

  // ─── listLinkedChats ───────────────────────────────────────────────────────

  describe('listLinkedChats', () => {
    it('calls permission check and returns identities', async () => {
      mockFindIdentitiesForWeddingFn.mockResolvedValue([mockIdentity])
      const result = await service.listLinkedChats(ctx, 'wedding-123')
      expect(result).toHaveLength(1)
      expect(mockRequirePermission).toHaveBeenCalledWith(ctx, { wedding: ['read'] })
      expect(mockFindIdentitiesForWeddingFn).toHaveBeenCalledWith('wedding-123')
    })
  })

  // ─── pending invoke seq ────────────────────────────────────────────────────

  describe('pending invoke seq passthroughs', () => {
    it('bumpPendingInvokeSeq delegates to repo', async () => {
      mockBumpPendingInvokeSeqFn.mockResolvedValue(5)
      const result = await service.bumpPendingInvokeSeq('identity-1')
      expect(result).toBe(5)
      expect(mockBumpPendingInvokeSeqFn).toHaveBeenCalledWith('identity-1')
    })

    it('getPendingInvokeSeq delegates to repo', async () => {
      mockGetPendingInvokeSeqFn.mockResolvedValue(3)
      const result = await service.getPendingInvokeSeq('identity-1')
      expect(result).toBe(3)
    })
  })

  // ─── appendMessage ─────────────────────────────────────────────────────────

  describe('appendMessage', () => {
    it('passthrough to repo', async () => {
      mockAppendMessageFn.mockResolvedValue(mockChatMessage)
      const result = await service.appendMessage({
        identityId: 'identity-1',
        weddingId: 'wedding-123',
        role: 'user',
        content: 'hello',
      })
      expect(result).toEqual(mockChatMessage)
    })
  })

  describe('markSummarized', () => {
    it('passthrough to repo', async () => {
      mockMarkSummarizedFn.mockResolvedValue(undefined)
      await service.markSummarized(['m-1', 'm-2'])
      expect(mockMarkSummarizedFn).toHaveBeenCalledWith(['m-1', 'm-2'])
    })
  })
})
