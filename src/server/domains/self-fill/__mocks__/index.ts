/**
 * Self-Fill Domain - Jest Manual Mock (barrel index)
 *
 * Mocks selfFillService singleton and createSelfFillRouter factory.
 * Used when jest.mock('~/server/domains/self-fill') is called.
 */

import type { SelfFillWeddingData } from '~/server/domains/self-fill/self-fill.types'

export const mockSelfFillWeddingData: SelfFillWeddingData = {
  id: 'wedding-123',
  groomFirstName: 'John',
  groomLastName: 'Doe',
  brideFirstName: 'Jane',
  brideLastName: 'Smith',
  events: [
    {
      id: 'event-123',
      name: 'Ceremony',
      date: new Date('2025-06-15'),
      venue: 'St. Mary Church',
    },
    {
      id: 'event-456',
      name: 'Reception',
      date: new Date('2025-06-15'),
      venue: 'Grand Ballroom',
    },
  ],
}

// Mock functions for selfFillService methods
export const mockFindByToken = jest.fn()
export const mockGenerateToken = jest.fn()
export const mockRevokeToken = jest.fn()
export const mockGetToken = jest.fn()

// Mock selfFillService singleton
export const selfFillService = {
  getWeddingByToken: mockFindByToken,
  generateToken: mockGenerateToken,
  revokeToken: mockRevokeToken,
  getToken: mockGetToken,
}

export const resetMocks = (): void => {
  mockFindByToken.mockReset()
  mockGenerateToken.mockReset()
  mockRevokeToken.mockReset()
  mockGetToken.mockReset()
}
