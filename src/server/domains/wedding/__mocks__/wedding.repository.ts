/**
 * Wedding Repository - Jest Manual Mock
 *
 * This mock is automatically used when jest.mock('~/server/domains/wedding/wedding.repository') is called.
 */

import { type Wedding } from '~/server/domains/wedding/wedding.types'

export const mockWedding: Wedding = {
  id: 'wedding-123',
  groomFirstName: 'John',
  groomLastName: 'Doe',
  brideFirstName: 'Jane',
  brideLastName: 'Smith',
  enabledAddOns: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockUserWedding = {
  id: 'user-wedding-123',
  userId: 'user-123',
  weddingId: 'wedding-123',
  role: 'owner',
  isPrimary: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockFindById = jest.fn()
export const mockFindByUserId = jest.fn()
export const mockCreate = jest.fn()
export const mockUpdate = jest.fn()
export const mockExistsForUser = jest.fn()

export const WeddingRepository = jest.fn().mockImplementation(() => ({
  findById: mockFindById,
  findByUserId: mockFindByUserId,
  create: mockCreate,
  update: mockUpdate,
  existsForUser: mockExistsForUser,
}))

// Helper to reset all mocks
export const resetMocks = (): void => {
  mockFindById.mockReset()
  mockFindByUserId.mockReset()
  mockCreate.mockReset()
  mockUpdate.mockReset()
  mockExistsForUser.mockReset()
  WeddingRepository.mockClear()
}
