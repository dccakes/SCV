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
  email: 'john@example.com',
  phone: '+1234567890',
  householdId: 'household-123',
  weddingId: 'wedding-123',
  isPrimaryContact: true,
  ageGroup: 'ADULT',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockGuestWithInvitations: GuestWithInvitations = {
  ...mockGuest,
  invitations: [
    {
      id: 'inv-123',
      guestId: 1,
      eventId: 'event-123',
      weddingId: 'wedding-123',
      rsvp: 'Attending',
      dietaryRestrictions: null,
      submittedBy: null,
      submittedAt: null,
      invitedAt: new Date('2024-01-01'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
}

export const mockFindById = jest.fn()
export const mockFindByIdWithInvitations = jest.fn()
export const mockFindByWeddingId = jest.fn()
export const mockFindByHouseholdId = jest.fn()
export const mockFindByHouseholdIdWithInvitations = jest.fn()
export const mockCreate = jest.fn()
export const mockUpdate = jest.fn()
export const mockUpdateTags = jest.fn()
export const mockUpsert = jest.fn()
export const mockDelete = jest.fn()
export const mockDeleteMany = jest.fn()
export const mockExists = jest.fn()
export const mockBelongsToWedding = jest.fn()
export const mockCountByWeddingId = jest.fn()

export const GuestRepository = jest.fn().mockImplementation(() => ({
  findById: mockFindById,
  findByIdWithInvitations: mockFindByIdWithInvitations,
  findByWeddingId: mockFindByWeddingId,
  findByHouseholdId: mockFindByHouseholdId,
  findByHouseholdIdWithInvitations: mockFindByHouseholdIdWithInvitations,
  create: mockCreate,
  update: mockUpdate,
  updateTags: mockUpdateTags,
  upsert: mockUpsert,
  delete: mockDelete,
  deleteMany: mockDeleteMany,
  exists: mockExists,
  belongsToWedding: mockBelongsToWedding,
  countByWeddingId: mockCountByWeddingId,
}))

// Helper to reset all mocks
export const resetMocks = (): void => {
  mockFindById.mockReset()
  mockFindByIdWithInvitations.mockReset()
  mockFindByWeddingId.mockReset()
  mockFindByHouseholdId.mockReset()
  mockFindByHouseholdIdWithInvitations.mockReset()
  mockCreate.mockReset()
  mockUpdate.mockReset()
  mockUpdateTags.mockReset()
  mockUpsert.mockReset()
  mockDelete.mockReset()
  mockDeleteMany.mockReset()
  mockExists.mockReset()
  mockBelongsToWedding.mockReset()
  mockCountByWeddingId.mockReset()
  GuestRepository.mockClear()
}
