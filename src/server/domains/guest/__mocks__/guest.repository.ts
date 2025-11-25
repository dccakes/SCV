/**
 * Guest Repository - Jest Manual Mock
 *
 * This mock is automatically used when jest.mock('~/server/domains/guest/guest.repository') is called.
 */

import { type Guest, type GuestWithInvitations } from '~/server/domains/guest/guest.types'

export const mockGuest: Guest = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  householdId: 'household-123',
  userId: 'user-123',
  isPrimaryContact: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockGuestWithInvitations: GuestWithInvitations = {
  ...mockGuest,
  invitations: [
    {
      guestId: 1,
      eventId: 'event-123',
      invitedAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      rsvp: 'Attending',
      userId: 'user-123',
    },
  ],
}

export const mockFindById = jest.fn()
export const mockFindByIdWithInvitations = jest.fn()
export const mockFindByUserId = jest.fn()
export const mockFindByHouseholdId = jest.fn()
export const mockFindByHouseholdIdWithInvitations = jest.fn()
export const mockCreate = jest.fn()
export const mockCreateWithInvitations = jest.fn()
export const mockUpdate = jest.fn()
export const mockUpsert = jest.fn()
export const mockDelete = jest.fn()
export const mockDeleteMany = jest.fn()
export const mockExists = jest.fn()
export const mockBelongsToUser = jest.fn()

export const GuestRepository = jest.fn().mockImplementation(() => ({
  findById: mockFindById,
  findByIdWithInvitations: mockFindByIdWithInvitations,
  findByUserId: mockFindByUserId,
  findByHouseholdId: mockFindByHouseholdId,
  findByHouseholdIdWithInvitations: mockFindByHouseholdIdWithInvitations,
  create: mockCreate,
  createWithInvitations: mockCreateWithInvitations,
  update: mockUpdate,
  upsert: mockUpsert,
  delete: mockDelete,
  deleteMany: mockDeleteMany,
  exists: mockExists,
  belongsToUser: mockBelongsToUser,
}))

// Helper to reset all mocks
export const resetMocks = (): void => {
  mockFindById.mockReset()
  mockFindByIdWithInvitations.mockReset()
  mockFindByUserId.mockReset()
  mockFindByHouseholdId.mockReset()
  mockFindByHouseholdIdWithInvitations.mockReset()
  mockCreate.mockReset()
  mockCreateWithInvitations.mockReset()
  mockUpdate.mockReset()
  mockUpsert.mockReset()
  mockDelete.mockReset()
  mockDeleteMany.mockReset()
  mockExists.mockReset()
  mockBelongsToUser.mockReset()
  GuestRepository.mockClear()
}
