/**
 * Wedding Domain - Jest Manual Mock (barrel index)
 *
 * Mocks weddingService singleton.
 * Used when jest.mock('~/server/domains/wedding') is called.
 */

import type { Wedding } from '~/server/domains/wedding/wedding.types'

export const mockWedding: Wedding = {
  id: 'wedding-123',
  groomFirstName: 'John',
  groomLastName: 'Doe',
  brideFirstName: 'Jane',
  brideLastName: 'Smith',
  enabledAddOns: [],
  organizationId: null,
  selfFillToken: null,
  selfFillTokenGeneratedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

// Mock functions for weddingService methods
export const mockGetByUserId = jest.fn()
export const mockGetById = jest.fn()
export const mockCreate = jest.fn()
export const mockUpdate = jest.fn()

// Mock weddingService singleton
export const weddingService = {
  getByUserId: mockGetByUserId,
  getById: mockGetById,
  create: mockCreate,
  update: mockUpdate,
}

export const resetMocks = (): void => {
  mockGetByUserId.mockReset()
  mockGetById.mockReset()
  mockCreate.mockReset()
  mockUpdate.mockReset()
}
