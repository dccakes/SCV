/**
 * Messaging Repository - Jest Manual Mock
 *
 * Automatically used when jest.mock('~/server/domains/messaging/messaging.repository') is called.
 */

import type {
  ChatMessage,
  MessagingIdentity,
  MessagingPairingToken,
  WhatsAppNumber,
} from '~/server/domains/messaging/messaging.types'

export const mockIdentity: MessagingIdentity = {
  id: 'identity-123',
  weddingId: 'wedding-123',
  channel: 'telegram',
  serviceNumber: '',
  externalChatId: 'chat-42',
  externalUserId: 'tg-user-7',
  displayName: 'Alice',
  linkedByUserId: 'user-1',
  householdId: null,
  guestId: null,
  linkedAt: new Date('2026-04-21T10:00:00Z'),
  revokedAt: null,
  pendingInvokeSeq: 0,
}

export const mockWhatsAppIdentity: MessagingIdentity = {
  id: 'identity-wa-1',
  weddingId: 'wedding-123',
  channel: 'whatsapp',
  serviceNumber: '+14155550100',
  externalChatId: '+5215512345678',
  externalUserId: null,
  displayName: 'Maria',
  linkedByUserId: null,
  householdId: 'household-1',
  guestId: 7,
  linkedAt: new Date('2026-04-21T10:00:00Z'),
  revokedAt: null,
  pendingInvokeSeq: 0,
}

export const mockWhatsAppNumber: WhatsAppNumber = {
  id: 'wanum-1',
  phoneNumber: '+14155550100',
  weddingId: 'wedding-123',
  provider: 'twilio',
  status: 'assigned',
  assignedAt: new Date('2026-04-20T10:00:00Z'),
  createdAt: new Date('2026-04-01T10:00:00Z'),
  updatedAt: new Date('2026-04-20T10:00:00Z'),
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
export const mockResolveOrgMembership = jest.fn()
export const mockFindWhatsAppNumberByPhone = jest.fn()
export const mockFindWhatsAppNumberForWedding = jest.fn()
export const mockClaimAvailableWhatsAppNumber = jest.fn()
export const mockFindGuestByPhone = jest.fn()
export const mockFindOrCreateWhatsAppIdentity = jest.fn()
export const mockFindWhatsAppConversations = jest.fn()
export const mockFindMessagesForIdentity = jest.fn()
export const mockFindHouseholdsWithGuestPhones = jest.fn()
export const mockFindActiveWhatsAppIdentities = jest.fn()

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
  resolveOrgMembership: mockResolveOrgMembership,
  findWhatsAppNumberByPhone: mockFindWhatsAppNumberByPhone,
  findWhatsAppNumberForWedding: mockFindWhatsAppNumberForWedding,
  claimAvailableWhatsAppNumber: mockClaimAvailableWhatsAppNumber,
  findGuestByPhone: mockFindGuestByPhone,
  findOrCreateWhatsAppIdentity: mockFindOrCreateWhatsAppIdentity,
  findWhatsAppConversations: mockFindWhatsAppConversations,
  findMessagesForIdentity: mockFindMessagesForIdentity,
  findHouseholdsWithGuestPhones: mockFindHouseholdsWithGuestPhones,
  findActiveWhatsAppIdentities: mockFindActiveWhatsAppIdentities,
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
  mockResolveOrgMembership.mockReset()
  mockFindWhatsAppNumberByPhone.mockReset()
  mockFindWhatsAppNumberForWedding.mockReset()
  mockClaimAvailableWhatsAppNumber.mockReset()
  mockFindGuestByPhone.mockReset()
  mockFindOrCreateWhatsAppIdentity.mockReset()
  mockFindWhatsAppConversations.mockReset()
  mockFindMessagesForIdentity.mockReset()
  mockFindHouseholdsWithGuestPhones.mockReset()
  mockFindActiveWhatsAppIdentities.mockReset()
  MessagingRepository.mockClear()
}
