/**
 * Invitation Repository - Jest Manual Mock
 *
 * This mock is automatically used when jest.mock('~/server/domains/invitation/invitation.repository') is called.
 */

import { type Invitation } from '~/server/domains/invitation/invitation.types'

export const mockInvitation: Invitation = {
  id: 'inv-123',
  guestId: 1,
  eventId: 'event-123',
  weddingId: 'wedding-123',
  rsvp: 'Invited',
  dietaryRestrictions: null,
  submittedBy: null,
  submittedAt: null,
  invitedAt: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockRsvpStats = {
  attending: 10,
  invited: 5,
  declined: 3,
  notInvited: 2,
}

export const mockFindById = jest.fn()
export const mockFindByWeddingId = jest.fn()
export const mockFindByEventId = jest.fn()
export const mockFindByGuestId = jest.fn()
export const mockCreate = jest.fn()
export const mockCreateMany = jest.fn()
export const mockUpdate = jest.fn()
export const mockDelete = jest.fn()
export const mockExists = jest.fn()
export const mockGetRsvpCountsByEventId = jest.fn()

export const InvitationRepository = jest.fn().mockImplementation(() => ({
  findById: mockFindById,
  findByWeddingId: mockFindByWeddingId,
  findByEventId: mockFindByEventId,
  findByGuestId: mockFindByGuestId,
  create: mockCreate,
  createMany: mockCreateMany,
  update: mockUpdate,
  delete: mockDelete,
  exists: mockExists,
  getRsvpCountsByEventId: mockGetRsvpCountsByEventId,
}))

// Helper to reset all mocks
export const resetMocks = (): void => {
  mockFindById.mockReset()
  mockFindByWeddingId.mockReset()
  mockFindByEventId.mockReset()
  mockFindByGuestId.mockReset()
  mockCreate.mockReset()
  mockCreateMany.mockReset()
  mockUpdate.mockReset()
  mockDelete.mockReset()
  mockExists.mockReset()
  mockGetRsvpCountsByEventId.mockReset()
  InvitationRepository.mockClear()
}
