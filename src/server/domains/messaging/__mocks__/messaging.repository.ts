/**
 * Messaging Repository - Jest Manual Mock
 *
 * Automatically used when jest.mock('~/server/domains/messaging/messaging.repository') is called.
 */

import type {
  ChatMessage,
  MessagingIdentity,
  MessagingPairingToken,
} from '~/server/domains/messaging/messaging.types'

export const mockIdentity: MessagingIdentity = {
  id: 'identity-123',
  weddingId: 'wedding-123',
  channel: 'telegram',
  externalChatId: 'chat-42',
  externalUserId: 'tg-user-7',
  displayName: 'Alice',
  linkedByUserId: 'user-1',
  linkedAt: new Date('2026-04-21T10:00:00Z'),
  revokedAt: null,
  pendingInvokeSeq: 0,
}

export const mockPairingToken: MessagingPairingToken = {
  id: 'pairing-123',
  weddingId: 'wedding-123',
  channel: 'telegram',
  token: 'token-abc',
  createdByUserId: 'user-1',
  expiresAt: new Date('2026-04-21T12:15:00Z'),
  consumedAt: null,
  consumedChatId: null,
  createdAt: new Date('2026-04-21T12:00:00Z'),
}

export const mockChatMessage: ChatMessage = {
  id: 'message-123',
  identityId: 'identity-123',
  weddingId: 'wedding-123',
  role: 'user',
  content: 'Hello Etta',
  attachmentUrl: null,
  attachmentName: null,
  externalMessageId: null,
  summarizedAt: null,
  createdAt: new Date('2026-04-21T12:00:00Z'),
}

export const mockCreatePairingToken = jest.fn()
export const mockFindIdentityById = jest.fn()
export const mockFindIdentityByChat = jest.fn()
export const mockFindIdentitiesForWedding = jest.fn()
export const mockRevokeIdentity = jest.fn()
export const mockAppendMessage = jest.fn()
export const mockFindRecentMessages = jest.fn()
export const mockFindUnsummarizedMessages = jest.fn()
export const mockMarkSummarized = jest.fn()
export const mockBumpPendingInvokeSeq = jest.fn()
export const mockGetPendingInvokeSeq = jest.fn()
export const mockFindIdentitiesWithUnsummarized = jest.fn()
export const mockConsumeAndUpsert = jest.fn()

export const MessagingRepository = jest.fn().mockImplementation(() => ({
  createPairingToken: mockCreatePairingToken,
  findIdentityById: mockFindIdentityById,
  findIdentityByChat: mockFindIdentityByChat,
  findIdentitiesForWedding: mockFindIdentitiesForWedding,
  revokeIdentity: mockRevokeIdentity,
  appendMessage: mockAppendMessage,
  findRecentMessages: mockFindRecentMessages,
  findUnsummarizedMessages: mockFindUnsummarizedMessages,
  markSummarized: mockMarkSummarized,
  bumpPendingInvokeSeq: mockBumpPendingInvokeSeq,
  getPendingInvokeSeq: mockGetPendingInvokeSeq,
  findIdentitiesWithUnsummarized: mockFindIdentitiesWithUnsummarized,
  consumeAndUpsert: mockConsumeAndUpsert,
}))

export const resetMocks = (): void => {
  mockCreatePairingToken.mockReset()
  mockFindIdentityById.mockReset()
  mockFindIdentityByChat.mockReset()
  mockFindIdentitiesForWedding.mockReset()
  mockRevokeIdentity.mockReset()
  mockAppendMessage.mockReset()
  mockFindRecentMessages.mockReset()
  mockFindUnsummarizedMessages.mockReset()
  mockMarkSummarized.mockReset()
  mockBumpPendingInvokeSeq.mockReset()
  mockGetPendingInvokeSeq.mockReset()
  mockFindIdentitiesWithUnsummarized.mockReset()
  mockConsumeAndUpsert.mockReset()
  MessagingRepository.mockClear()
}
