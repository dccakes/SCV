/**
 * Tests for Household Management Application Service
 *
 * This service orchestrates cross-domain operations for household management.
 * Tests verify the service correctly coordinates multiple domain operations using repositories.
 */

import { TRPCError } from '@trpc/server'

// Must mock before importing the service
jest.mock('~/server/domains/household/household.repository')
jest.mock('~/server/domains/guest/guest.repository')
jest.mock('~/server/domains/invitation/invitation.repository')
jest.mock('~/server/domains/gift/gift.repository')

// @ts-expect-error - Importing mock functions from mocked module
import { HouseholdManagementService } from '~/server/application/household-management/household-management.service'
import {
  GiftRepository,
  mockGift,
  mockUpsert as mockGiftUpsert,
  resetMocks as resetGiftMocks,
} from '~/server/domains/gift/gift.repository'
// @ts-expect-error - Importing mock functions from mocked module
import {
  GuestRepository,
  mockCreate,
  mockDeleteMany,
  mockFindByIdWithInvitations,
  mockGuestWithInvitations,
  mockUpsert as mockGuestUpsert,
  resetMocks as resetGuestMocks,
} from '~/server/domains/guest/guest.repository'
// @ts-expect-error - Importing mock functions from mocked module
import {
  HouseholdRepository,
  mockCreateWithGifts,
  mockDelete,
  mockHousehold,
  mockUpdate,
  resetMocks as resetHouseholdMocks,
} from '~/server/domains/household/household.repository'
// @ts-expect-error - Importing mock functions from mocked module
import {
  InvitationRepository,
  mockInvitation,
  mockUpdate as mockInvitationUpdate,
  resetMocks as resetInvitationMocks,
} from '~/server/domains/invitation/invitation.repository'

// Create typed aliases for mock functions
const mockCreateWithGiftsFn = mockCreateWithGifts as jest.Mock
const mockCreateFn = mockCreate as jest.Mock
const mockFindByIdWithInvitationsFn = mockFindByIdWithInvitations as jest.Mock
const mockGuestUpsertFn = mockGuestUpsert as jest.Mock
const mockDeleteManyFn = mockDeleteMany as jest.Mock
const mockUpdateFn = mockUpdate as jest.Mock
const mockDeleteFn = mockDelete as jest.Mock
const mockInvitationUpdateFn = mockInvitationUpdate as jest.Mock
const mockGiftUpsertFn = mockGiftUpsert as jest.Mock

// Create mock Prisma client (still needed for guestTagAssignment operations)
const createMockDb = () => ({
  guest: {
    updateMany: jest.fn(),
  },
  guestTagAssignment: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
})

describe('HouseholdManagementService', () => {
  let service: HouseholdManagementService
  let mockDb: ReturnType<typeof createMockDb>

  beforeEach(() => {
    resetHouseholdMocks()
    resetGuestMocks()
    resetInvitationMocks()
    resetGiftMocks()
    mockDb = createMockDb()

    const mockHouseholdRepo = new HouseholdRepository({})
    const mockGuestRepo = new GuestRepository({})
    const mockInvitationRepo = new InvitationRepository({})
    const mockGiftRepo = new GiftRepository({})

    service = new HouseholdManagementService(
      mockHouseholdRepo,
      mockGuestRepo,
      mockInvitationRepo,
      mockGiftRepo,
      mockDb as never
    )
  })

  describe('createHouseholdWithGuests', () => {
    it('should create a household with guests and invitations', async () => {
      mockCreateWithGiftsFn.mockResolvedValue(mockHousehold)
      mockCreateFn.mockResolvedValue(mockGuestWithInvitations)
      mockFindByIdWithInvitationsFn.mockResolvedValue(mockGuestWithInvitations)

      const result = await service.createHouseholdWithGuests('wedding-123', {
        address1: '123 Main St',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001',
        guestParty: [
          {
            firstName: 'John',
            lastName: 'Doe',
            invites: { 'event-123': 'Invited' },
          },
        ],
      })

      expect(result.household).toEqual(mockHousehold)
      expect(result.guests).toHaveLength(1)
      expect(mockCreateWithGiftsFn).toHaveBeenCalledTimes(1)
      expect(mockCreateFn).toHaveBeenCalledTimes(1)
      expect(mockFindByIdWithInvitationsFn).toHaveBeenCalledTimes(1)
    })

    it('should create multiple guests for a household', async () => {
      const mockGuest2 = {
        ...mockGuestWithInvitations,
        id: 2,
        firstName: 'Jane',
        isPrimaryContact: false,
      }
      mockCreateWithGiftsFn.mockResolvedValue(mockHousehold)
      mockCreateFn
        .mockResolvedValueOnce({ ...mockGuestWithInvitations, isPrimaryContact: true })
        .mockResolvedValueOnce(mockGuest2)
      mockFindByIdWithInvitationsFn
        .mockResolvedValueOnce({ ...mockGuestWithInvitations, isPrimaryContact: true })
        .mockResolvedValueOnce(mockGuest2)

      const result = await service.createHouseholdWithGuests('wedding-123', {
        guestParty: [
          { firstName: 'John', lastName: 'Doe', invites: { 'event-123': 'Invited' } },
          { firstName: 'Jane', lastName: 'Doe', invites: { 'event-123': 'Invited' } },
        ],
      })

      expect(result.guests).toHaveLength(2)
      expect(mockCreateFn).toHaveBeenCalledTimes(2)
      expect(mockFindByIdWithInvitationsFn).toHaveBeenCalledTimes(2)
    })

    it('should use isPrimaryContact from form when provided', async () => {
      mockCreateWithGiftsFn.mockResolvedValue(mockHousehold)
      mockCreateFn.mockResolvedValue(mockGuestWithInvitations)
      mockFindByIdWithInvitationsFn.mockResolvedValue(mockGuestWithInvitations)

      await service.createHouseholdWithGuests('wedding-123', {
        guestParty: [
          { firstName: 'John', lastName: 'Doe', isPrimaryContact: false, invites: {} },
          { firstName: 'Jane', lastName: 'Doe', isPrimaryContact: true, invites: {} },
        ],
      })

      // Should use value from form, not default to first guest
      expect(mockCreateFn.mock.calls[0][0].isPrimaryContact).toBe(false)
      expect(mockCreateFn.mock.calls[1][0].isPrimaryContact).toBe(true)
    })

    it('should default first guest as primary contact when not provided', async () => {
      mockCreateWithGiftsFn.mockResolvedValue(mockHousehold)
      mockCreateFn.mockResolvedValue(mockGuestWithInvitations)
      mockFindByIdWithInvitationsFn.mockResolvedValue(mockGuestWithInvitations)

      await service.createHouseholdWithGuests('wedding-123', {
        guestParty: [
          { firstName: 'John', lastName: 'Doe', invites: {} },
          { firstName: 'Jane', lastName: 'Doe', invites: {} },
        ],
      })

      // Fallback: First guest should be primary when not specified
      expect(mockCreateFn.mock.calls[0][0].isPrimaryContact).toBe(true)
      expect(mockCreateFn.mock.calls[1][0].isPrimaryContact).toBe(false)
    })

    it('should create gifts for each event', async () => {
      mockCreateWithGiftsFn.mockResolvedValue(mockHousehold)
      mockCreateFn.mockResolvedValue(mockGuestWithInvitations)
      mockFindByIdWithInvitationsFn.mockResolvedValue(mockGuestWithInvitations)

      await service.createHouseholdWithGuests('wedding-123', {
        guestParty: [
          {
            firstName: 'John',
            lastName: 'Doe',
            invites: { 'event-123': 'Invited', 'event-456': 'Invited' },
          },
        ],
      })

      // Verify createWithGifts was called with both event IDs
      const eventIds = mockCreateWithGiftsFn.mock.calls[0][1]
      expect(eventIds).toEqual(['event-123', 'event-456'])
    })

    it('should throw error if household creation fails', async () => {
      mockCreateWithGiftsFn.mockResolvedValue(null)

      await expect(
        service.createHouseholdWithGuests('wedding-123', {
          guestParty: [{ firstName: 'John', lastName: 'Doe', invites: {} }],
        })
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('updateHouseholdWithGuests', () => {
    it('should update household details', async () => {
      const updatedHousehold = { ...mockHousehold, address1: '456 New St' }
      mockUpdateFn.mockResolvedValue(updatedHousehold)
      mockDb.guest.updateMany.mockResolvedValue({ count: 1 })
      mockGuestUpsertFn.mockResolvedValue(mockGuestWithInvitations)
      mockFindByIdWithInvitationsFn.mockResolvedValue(mockGuestWithInvitations)
      mockInvitationUpdateFn.mockResolvedValue(mockInvitation)
      mockGiftUpsertFn.mockResolvedValue(mockGift)

      const result = await service.updateHouseholdWithGuests('wedding-123', {
        householdId: 'household-123',
        address1: '456 New St',
        guestParty: [
          { guestId: 1, firstName: 'John', lastName: 'Doe', invites: { 'event-123': 'Attending' } },
        ],
        gifts: [{ eventId: 'event-123', description: 'Kitchen set', thankyou: true }],
      })

      expect(result.household.address1).toBe('456 New St')
      expect(mockUpdateFn).toHaveBeenCalledWith(
        'household-123',
        expect.objectContaining({ address1: '456 New St' })
      )
    })

    it('should delete removed guests', async () => {
      mockUpdateFn.mockResolvedValue(mockHousehold)
      mockDb.guest.updateMany.mockResolvedValue({ count: 1 })
      mockDeleteManyFn.mockResolvedValue({ count: 2 })
      mockGuestUpsertFn.mockResolvedValue(mockGuestWithInvitations)
      mockFindByIdWithInvitationsFn.mockResolvedValue(mockGuestWithInvitations)
      mockInvitationUpdateFn.mockResolvedValue(mockInvitation)
      mockGiftUpsertFn.mockResolvedValue(mockGift)

      await service.updateHouseholdWithGuests('wedding-123', {
        householdId: 'household-123',
        guestParty: [
          { guestId: 1, firstName: 'John', lastName: 'Doe', invites: { 'event-123': 'Attending' } },
        ],
        deletedGuests: [2, 3],
        gifts: [],
      })

      expect(mockDeleteManyFn).toHaveBeenCalledWith([2, 3])
    })

    it('should not call deleteMany when no guests to delete', async () => {
      mockUpdateFn.mockResolvedValue(mockHousehold)
      mockDb.guest.updateMany.mockResolvedValue({ count: 1 })
      mockGuestUpsertFn.mockResolvedValue(mockGuestWithInvitations)
      mockFindByIdWithInvitationsFn.mockResolvedValue(mockGuestWithInvitations)
      mockInvitationUpdateFn.mockResolvedValue(mockInvitation)
      mockGiftUpsertFn.mockResolvedValue(mockGift)

      await service.updateHouseholdWithGuests('wedding-123', {
        householdId: 'household-123',
        guestParty: [
          { guestId: 1, firstName: 'John', lastName: 'Doe', invites: { 'event-123': 'Attending' } },
        ],
        gifts: [],
      })

      expect(mockDeleteManyFn).not.toHaveBeenCalled()
    })

    it('should upsert guests and update invitations', async () => {
      mockUpdateFn.mockResolvedValue(mockHousehold)
      mockDb.guest.updateMany.mockResolvedValue({ count: 1 })
      mockGuestUpsertFn.mockResolvedValue(mockGuestWithInvitations)
      mockFindByIdWithInvitationsFn.mockResolvedValue(mockGuestWithInvitations)
      mockInvitationUpdateFn.mockResolvedValue(mockInvitation)
      mockGiftUpsertFn.mockResolvedValue(mockGift)

      await service.updateHouseholdWithGuests('wedding-123', {
        householdId: 'household-123',
        guestParty: [
          { guestId: 1, firstName: 'John', lastName: 'Doe', invites: { 'event-123': 'Attending' } },
        ],
        gifts: [],
      })

      expect(mockGuestUpsertFn).toHaveBeenCalledTimes(1)
      expect(mockInvitationUpdateFn).toHaveBeenCalledWith(1, 'event-123', {
        rsvp: 'Attending',
      })
    })

    it('should upsert gifts', async () => {
      mockUpdateFn.mockResolvedValue(mockHousehold)
      mockDb.guest.updateMany.mockResolvedValue({ count: 1 })
      mockGuestUpsertFn.mockResolvedValue(mockGuestWithInvitations)
      mockFindByIdWithInvitationsFn.mockResolvedValue(mockGuestWithInvitations)
      mockInvitationUpdateFn.mockResolvedValue(mockInvitation)
      mockGiftUpsertFn.mockResolvedValue(mockGift)

      await service.updateHouseholdWithGuests('wedding-123', {
        householdId: 'household-123',
        guestParty: [
          { guestId: 1, firstName: 'John', lastName: 'Doe', invites: { 'event-123': 'Attending' } },
        ],
        gifts: [{ eventId: 'event-123', description: 'Kitchen set', thankyou: true }],
      })

      expect(mockGiftUpsertFn).toHaveBeenCalledWith({
        householdId: 'household-123',
        eventId: 'event-123',
        description: 'Kitchen set',
        thankyou: true,
      })
    })

    it('should update isPrimaryContact when provided', async () => {
      mockUpdateFn.mockResolvedValue(mockHousehold)
      mockDb.guest.updateMany.mockResolvedValue({ count: 1 })
      mockGuestUpsertFn.mockResolvedValue(mockGuestWithInvitations)
      mockFindByIdWithInvitationsFn.mockResolvedValue(mockGuestWithInvitations)
      mockInvitationUpdateFn.mockResolvedValue(mockInvitation)
      mockGiftUpsertFn.mockResolvedValue(mockGift)

      await service.updateHouseholdWithGuests('wedding-123', {
        householdId: 'household-123',
        guestParty: [
          {
            guestId: 1,
            firstName: 'John',
            lastName: 'Doe',
            isPrimaryContact: true,
            invites: { 'event-123': 'Attending' },
          },
        ],
        gifts: [],
      })

      // Should call upsert with isPrimaryContact: true
      expect(mockGuestUpsertFn.mock.calls[0][1]).toEqual(
        expect.objectContaining({
          isPrimaryContact: true,
        })
      )
    })

    it('should create new guest with isPrimaryContact during update', async () => {
      mockUpdateFn.mockResolvedValue(mockHousehold)
      mockDb.guest.updateMany.mockResolvedValue({ count: 1 })
      mockGuestUpsertFn.mockResolvedValue(mockGuestWithInvitations)
      mockFindByIdWithInvitationsFn.mockResolvedValue(mockGuestWithInvitations)
      mockInvitationUpdateFn.mockResolvedValue(mockInvitation)
      mockGiftUpsertFn.mockResolvedValue(mockGift)

      await service.updateHouseholdWithGuests('wedding-123', {
        householdId: 'household-123',
        guestParty: [
          {
            // New guest (no guestId)
            firstName: 'Jane',
            lastName: 'Doe',
            isPrimaryContact: false,
            invites: { 'event-123': 'Invited' },
          },
        ],
        gifts: [],
      })

      // New guest should use form value for isPrimaryContact
      expect(mockGuestUpsertFn.mock.calls[0][1]).toEqual(
        expect.objectContaining({
          isPrimaryContact: false,
        })
      )
    })

    it('should clear all primary contacts before upserting', async () => {
      mockUpdateFn.mockResolvedValue(mockHousehold)
      mockDb.guest.updateMany.mockResolvedValue({ count: 2 })
      mockGuestUpsertFn.mockResolvedValue(mockGuestWithInvitations)
      mockFindByIdWithInvitationsFn.mockResolvedValue(mockGuestWithInvitations)
      mockInvitationUpdateFn.mockResolvedValue(mockInvitation)
      mockGiftUpsertFn.mockResolvedValue(mockGift)

      await service.updateHouseholdWithGuests('wedding-123', {
        householdId: 'household-123',
        guestParty: [
          {
            guestId: 1,
            firstName: 'John',
            lastName: 'Doe',
            isPrimaryContact: true,
            invites: { 'event-123': 'Attending' },
          },
        ],
        gifts: [],
      })

      // Should clear all primary contacts in household first
      expect(mockDb.guest.updateMany).toHaveBeenCalledWith({
        where: { householdId: 'household-123' },
        data: { isPrimaryContact: false },
      })
    })
  })

  describe('deleteHousehold', () => {
    it('should delete a household and return its id', async () => {
      mockDeleteFn.mockResolvedValue(mockHousehold)

      const result = await service.deleteHousehold('household-123')

      expect(result).toBe('household-123')
      expect(mockDeleteFn).toHaveBeenCalledWith('household-123')
    })

    it('should call delete with correct householdId', async () => {
      mockDeleteFn.mockResolvedValue({ ...mockHousehold, id: 'another-household' })

      await service.deleteHousehold('another-household')

      expect(mockDeleteFn).toHaveBeenCalledWith('another-household')
    })
  })
})
