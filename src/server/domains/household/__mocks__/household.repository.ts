/**
 * Household Repository - Jest Manual Mock
 *
 * This mock is automatically used when jest.mock('~/server/domains/household/household.repository') is called.
 */

import {
  type Household,
  type HouseholdSearchResult,
  type HouseholdWithGuestsAndGifts,
} from '~/server/domains/household/household.types'

export const mockHousehold: Household = {
  id: 'household-123',
  userId: 'user-123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  address1: '123 Main St',
  address2: 'Apt 4B',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
  country: 'USA',
  phone: '555-1234',
  email: 'doe@example.com',
  notes: 'Family of the groom',
}

export const mockHouseholdWithGuestsAndGifts: HouseholdWithGuestsAndGifts = {
  ...mockHousehold,
  guests: [
    {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      householdId: 'household-123',
      userId: 'user-123',
      isPrimaryContact: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
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
    },
    {
      id: 2,
      firstName: 'Jane',
      lastName: 'Doe',
      householdId: 'household-123',
      userId: 'user-123',
      isPrimaryContact: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      invitations: [
        {
          guestId: 2,
          eventId: 'event-123',
          invitedAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          rsvp: 'Attending',
          userId: 'user-123',
        },
      ],
    },
  ],
  gifts: [
    {
      householdId: 'household-123',
      eventId: 'event-123',
      description: 'Kitchen set',
      thankyou: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
}

export const mockSearchResult: HouseholdSearchResult = {
  id: 'household-123',
  guests: mockHouseholdWithGuestsAndGifts.guests,
}

export const mockFindById = jest.fn()
export const mockFindByIdWithGuestsAndGifts = jest.fn()
export const mockFindByUserId = jest.fn()
export const mockFindByUserIdWithGuestsAndGifts = jest.fn()
export const mockCreate = jest.fn()
export const mockCreateWithGifts = jest.fn()
export const mockUpdate = jest.fn()
export const mockDelete = jest.fn()
export const mockSearch = jest.fn()
export const mockExists = jest.fn()
export const mockBelongsToUser = jest.fn()

export const HouseholdRepository = jest.fn().mockImplementation(() => ({
  findById: mockFindById,
  findByIdWithGuestsAndGifts: mockFindByIdWithGuestsAndGifts,
  findByUserId: mockFindByUserId,
  findByUserIdWithGuestsAndGifts: mockFindByUserIdWithGuestsAndGifts,
  create: mockCreate,
  createWithGifts: mockCreateWithGifts,
  update: mockUpdate,
  delete: mockDelete,
  search: mockSearch,
  exists: mockExists,
  belongsToUser: mockBelongsToUser,
}))

// Helper to reset all mocks
export const resetMocks = (): void => {
  mockFindById.mockReset()
  mockFindByIdWithGuestsAndGifts.mockReset()
  mockFindByUserId.mockReset()
  mockFindByUserIdWithGuestsAndGifts.mockReset()
  mockCreate.mockReset()
  mockCreateWithGifts.mockReset()
  mockUpdate.mockReset()
  mockDelete.mockReset()
  mockSearch.mockReset()
  mockExists.mockReset()
  mockBelongsToUser.mockReset()
  HouseholdRepository.mockClear()
}
