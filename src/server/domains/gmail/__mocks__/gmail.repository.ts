/**
 * Gmail Repository - Jest Manual Mock
 *
 * Automatically used when jest.mock('~/server/domains/gmail/gmail.repository') is called.
 */

import type { StoredMessage } from '~/server/domains/gmail/gmail.types'

export const mockConnection = {
  id: 'conn-123',
  userId: 'user-123',
  provider: 'gmail' as const,
  email: 'user@example.com',
  accessToken: 'access-token-123',
  refreshToken: 'refresh-token-123',
  scope: 'https://www.googleapis.com/auth/gmail.readonly',
  expiresAt: new Date('2026-12-31'),
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

export const mockSyncState = {
  id: 'sync-123',
  connectionId: 'conn-123',
  cursor: null,
  pageToken: null,
  lastSyncedAt: new Date('2026-01-15'),
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-15'),
}

export const mockStoredMessage: StoredMessage = {
  id: 'msg-123',
  weddingId: 'wedding-123',
  connectionId: 'conn-123',
  vendorId: 'vendor-123',
  vendorName: 'Alice Photos',
  provider: 'gmail',
  externalMessageId: 'gmail-msg-abc',
  externalThreadId: 'gmail-thread-abc',
  subject: 'Wedding Photography',
  body: 'Looking forward to your wedding!',
  snippet: 'Looking forward to your wedding!',
  senderAddress: 'alice@alicephotos.com',
  senderName: 'Alice Smith',
  recipientAddresses: ['user@example.com'],
  direction: 'inbound',
  sentAt: new Date('2026-01-10'),
  isDraft: false,
  createdAt: new Date('2026-01-10'),
}

export const mockFindConnectionByUserId = jest.fn()
export const mockUpsertConnection = jest.fn()
export const mockUpdateTokens = jest.fn()
export const mockDeleteConnection = jest.fn()
export const mockGetSyncState = jest.fn()
export const mockUpsertSyncState = jest.fn()
export const mockUpsertMessage = jest.fn()
export const mockFindMessagesByWedding = jest.fn()
export const mockFindMessagesByThread = jest.fn()
export const mockDeleteMessagesByConnectionId = jest.fn()
export const mockGetVendorEmailMap = jest.fn()
export const mockGetVendorForSync = jest.fn()

export const mockFindWeddingIdByUserId = jest.fn()

export const GmailRepository = jest.fn().mockImplementation(() => ({
  findConnectionByUserId: mockFindConnectionByUserId,
  upsertConnection: mockUpsertConnection,
  updateTokens: mockUpdateTokens,
  deleteConnection: mockDeleteConnection,
  getSyncState: mockGetSyncState,
  upsertSyncState: mockUpsertSyncState,
  upsertMessage: mockUpsertMessage,
  findMessagesByWedding: mockFindMessagesByWedding,
  findMessagesByThread: mockFindMessagesByThread,
  deleteMessagesByConnectionId: mockDeleteMessagesByConnectionId,
  getVendorEmailMap: mockGetVendorEmailMap,
  getVendorForSync: mockGetVendorForSync,
  findWeddingIdByUserId: mockFindWeddingIdByUserId,
}))

export const resetMocks = (): void => {
  mockFindConnectionByUserId.mockReset()
  mockUpsertConnection.mockReset()
  mockUpdateTokens.mockReset()
  mockDeleteConnection.mockReset()
  mockGetSyncState.mockReset()
  mockUpsertSyncState.mockReset()
  mockUpsertMessage.mockReset()
  mockFindMessagesByWedding.mockReset()
  mockFindMessagesByThread.mockReset()
  mockDeleteMessagesByConnectionId.mockReset()
  mockGetVendorEmailMap.mockReset()
  mockGetVendorForSync.mockReset()
  mockFindWeddingIdByUserId.mockReset()
  GmailRepository.mockClear()
}
