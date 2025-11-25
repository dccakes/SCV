/**
 * User Repository - Jest Manual Mock
 *
 * This mock is automatically used when jest.mock('~/server/domains/user/user.repository') is called.
 */

import { type User } from '~/server/domains/user/user.types'

export const mockUser: User = {
  id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  emailVerified: true,
  image: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  websiteUrl: 'https://example.com/wedding',
  groomFirstName: 'John',
  groomLastName: 'Doe',
  brideFirstName: 'Jane',
  brideLastName: 'Doe',
}

export const mockFindById = jest.fn()
export const mockFindByEmail = jest.fn()
export const mockCreate = jest.fn()
export const mockUpdate = jest.fn()
export const mockExists = jest.fn()

export const UserRepository = jest.fn().mockImplementation(() => ({
  findById: mockFindById,
  findByEmail: mockFindByEmail,
  create: mockCreate,
  update: mockUpdate,
  exists: mockExists,
}))

// Helper to reset all mocks
export const resetMocks = (): void => {
  mockFindById.mockReset()
  mockFindByEmail.mockReset()
  mockCreate.mockReset()
  mockUpdate.mockReset()
  mockExists.mockReset()
  UserRepository.mockClear()
}
