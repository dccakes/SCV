/**
 * Self-Fill Repository - Jest Manual Mock
 *
 * This mock is automatically used when jest.mock('~/server/domains/self-fill/self-fill.repository') is called.
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

/** Re-exported so service tests can use it without hitting the mocked module boundary */
export const TOKEN_EXPIRY_DAYS = 90

export const mockFindByToken = jest.fn()
export const mockGetWeddingIdByToken = jest.fn()
export const mockUpdateToken = jest.fn()
export const mockGetToken = jest.fn()
export const mockGetEarliestEventDate = jest.fn()

export const SelfFillRepository = jest.fn().mockImplementation(() => ({
  findByToken: mockFindByToken,
  getWeddingIdByToken: mockGetWeddingIdByToken,
  updateToken: mockUpdateToken,
  getToken: mockGetToken,
  getEarliestEventDate: mockGetEarliestEventDate,
}))

// Helper to reset all mocks
export const resetMocks = (): void => {
  mockFindByToken.mockReset()
  mockGetWeddingIdByToken.mockReset()
  mockUpdateToken.mockReset()
  mockGetToken.mockReset()
  mockGetEarliestEventDate.mockReset()
  SelfFillRepository.mockClear()
}
