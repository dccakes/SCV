/**
 * Gift Repository - Jest Manual Mock
 *
 * This mock is automatically used when jest.mock('~/server/domains/gift/gift.repository') is called.
 */

import { type Gift } from '~/server/domains/gift/gift.types'

export const mockGift: Gift = {
  householdId: 'household-123',
  eventId: 'event-123',
  description: 'Beautiful vase',
  thankyou: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockFindById = jest.fn()
export const mockFindByHouseholdId = jest.fn()
export const mockFindByEventId = jest.fn()
export const mockCreate = jest.fn()
export const mockCreateMany = jest.fn()
export const mockUpdate = jest.fn()
export const mockUpsert = jest.fn()
export const mockDelete = jest.fn()
export const mockExists = jest.fn()

export const GiftRepository = jest.fn().mockImplementation(() => ({
  findById: mockFindById,
  findByHouseholdId: mockFindByHouseholdId,
  findByEventId: mockFindByEventId,
  create: mockCreate,
  createMany: mockCreateMany,
  update: mockUpdate,
  upsert: mockUpsert,
  delete: mockDelete,
  exists: mockExists,
}))

// Helper to reset all mocks
export const resetMocks = (): void => {
  mockFindById.mockReset()
  mockFindByHouseholdId.mockReset()
  mockFindByEventId.mockReset()
  mockCreate.mockReset()
  mockCreateMany.mockReset()
  mockUpdate.mockReset()
  mockUpsert.mockReset()
  mockDelete.mockReset()
  mockExists.mockReset()
  GiftRepository.mockClear()
}
