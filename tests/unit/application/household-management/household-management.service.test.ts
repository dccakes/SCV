/**
 * Tests for Household Management Application Service
 *
 * This service orchestrates cross-domain operations for household management.
 * Tests verify the service correctly coordinates multiple domain operations
 * within transactions using the Prisma client directly.
 */

import { TRPCError } from '@trpc/server'

// Must mock before importing the service
jest.mock('~/server/domains/household/household.repository')
jest.mock('~/server/domains/guest/guest.repository')
jest.mock('~/server/domains/invitation/invitation.repository')
jest.mock('~/server/domains/gift/gift.repository')

// @ts-expect-error - Importing mock functions from mocked module
import { HouseholdManagementService } from '~/server/application/household-management/household-management.service'
import { GiftRepository, resetMocks as resetGiftMocks } from '~/server/domains/gift/gift.repository'
// @ts-expect-error - Importing mock functions from mocked module
import {
  GuestRepository,
  resetMocks as resetGuestMocks,
} from '~/server/domains/guest/guest.repository'
// @ts-expect-error - Importing mock functions from mocked module
import {
  HouseholdRepository,
  mockDelete,
  mockHousehold,
  resetMocks as resetHouseholdMocks,
} from '~/server/domains/household/household.repository'
// @ts-expect-error - Importing mock functions from mocked module
import {
  InvitationRepository,
  mockInvitation,
  resetMocks as resetInvitationMocks,
} from '~/server/domains/invitation/invitation.repository'

const mockDeleteFn = mockDelete as jest.Mock

// Mock guest data for refetch
const mockGuestWithInvitations = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: null,
  phone: null,
  isPrimaryContact: true,
  householdId: 'household-123',
  weddingId: 'wedding-123',
  ageGroup: 'ADULT',
  isTagAlong: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  invitations: [mockInvitation],
  guestTagAssignments: [],
}

const mockGift = {
  householdId: 'household-123',
  eventId: 'event-123',
  description: 'Kitchen set',
  thankyou: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Create mock Prisma client with $transaction support
const createMockDb = () => {
  const models = {
    household: {
      create: jest.fn(),
      update: jest.fn(),
    },
    guest: {
      create: jest.fn(),
      upsert: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    invitation: {
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    guestTagAssignment: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    gift: {
      upsert: jest.fn(),
    },
  }

  return {
    ...models,
    $transaction: jest.fn().mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn(models)
    }),
    // Keep raw references for assertions
    _models: models,
  }
}

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
    it('should create a household with guests and invitations in a transaction', async () => {
      mockDb.household.create.mockResolvedValue({
        ...mockHousehold,
        guests: [],
        gifts: [],
      })
      mockDb.guest.create.mockResolvedValue(mockGuestWithInvitations)
      mockDb.guest.findUnique.mockResolvedValue(mockGuestWithInvitations)

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

      expect(mockDb.$transaction).toHaveBeenCalledTimes(1)
      expect(result.guests).toHaveLength(1)
      expect(mockDb.household.create).toHaveBeenCalledTimes(1)
      expect(mockDb.guest.create).toHaveBeenCalledTimes(1)
    })

    it('should create multiple guests for a household', async () => {
      const mockGuest2 = {
        ...mockGuestWithInvitations,
        id: 2,
        firstName: 'Jane',
        isPrimaryContact: false,
      }
      mockDb.household.create.mockResolvedValue({
        ...mockHousehold,
        guests: [],
        gifts: [],
      })
      mockDb.guest.create
        .mockResolvedValueOnce({ ...mockGuestWithInvitations, isPrimaryContact: true })
        .mockResolvedValueOnce(mockGuest2)
      mockDb.guest.findUnique
        .mockResolvedValueOnce({ ...mockGuestWithInvitations, isPrimaryContact: true })
        .mockResolvedValueOnce(mockGuest2)

      const result = await service.createHouseholdWithGuests('wedding-123', {
        guestParty: [
          { firstName: 'John', lastName: 'Doe', invites: { 'event-123': 'Invited' } },
          { firstName: 'Jane', lastName: 'Doe', invites: { 'event-123': 'Invited' } },
        ],
      })

      expect(result.guests).toHaveLength(2)
      expect(mockDb.guest.create).toHaveBeenCalledTimes(2)
    })

    it('should create invitations for tag-along guests with allowTagAlongs events', async () => {
      mockDb.household.create.mockResolvedValue({
        ...mockHousehold,
        guests: [],
        gifts: [],
      })
      mockDb.guest.create.mockResolvedValue(mockGuestWithInvitations)
      mockDb.guest.findUnique.mockResolvedValue(mockGuestWithInvitations)

      await service.createHouseholdWithGuests('wedding-123', {
        guestParty: [
          {
            firstName: 'Baby',
            lastName: 'Doe',
            isTagAlong: true,
            invites: { 'event-456': 'Invited' },
          },
        ],
      })

      // Tag-along should have isPrimaryContact forced to false
      expect(mockDb.guest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isTagAlong: true,
            isPrimaryContact: false,
          }),
        })
      )
    })

    it('should set isPrimaryContact to false for tag-along guests', async () => {
      mockDb.household.create.mockResolvedValue({
        ...mockHousehold,
        guests: [],
        gifts: [],
      })
      mockDb.guest.create.mockResolvedValue(mockGuestWithInvitations)
      mockDb.guest.findUnique.mockResolvedValue(mockGuestWithInvitations)

      await service.createHouseholdWithGuests('wedding-123', {
        guestParty: [
          {
            firstName: 'Regular',
            lastName: 'Guest',
            isPrimaryContact: true,
            invites: {},
          },
          {
            firstName: 'Tag',
            lastName: 'Along',
            isTagAlong: true,
            isPrimaryContact: true, // Attempted, but should be overridden
            invites: {},
          },
        ],
      })

      // Second call: tag-along should have isPrimaryContact forced to false
      const secondCallData = mockDb.guest.create.mock.calls[1][0].data
      expect(secondCallData.isPrimaryContact).toBe(false)
    })

    it('should throw error if household creation fails', async () => {
      mockDb.household.create.mockResolvedValue(null)

      await expect(
        service.createHouseholdWithGuests('wedding-123', {
          guestParty: [{ firstName: 'John', lastName: 'Doe', invites: {} }],
        })
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('updateHouseholdWithGuests', () => {
    it('should update household details in a transaction', async () => {
      const updatedHousehold = { ...mockHousehold, address1: '456 New St' }
      mockDb.household.update.mockResolvedValue(updatedHousehold)
      mockDb.guest.updateMany.mockResolvedValue({ count: 1 })
      mockDb.guest.upsert.mockResolvedValue(mockGuestWithInvitations)
      mockDb.guest.findUnique.mockResolvedValue(mockGuestWithInvitations)
      mockDb.invitation.update.mockResolvedValue(mockInvitation)
      mockDb.gift.upsert.mockResolvedValue(mockGift)

      const result = await service.updateHouseholdWithGuests('wedding-123', {
        householdId: 'household-123',
        address1: '456 New St',
        guestParty: [
          { guestId: 1, firstName: 'John', lastName: 'Doe', invites: { 'event-123': 'Attending' } },
        ],
        gifts: [{ eventId: 'event-123', description: 'Kitchen set', thankyou: true }],
      })

      expect(mockDb.$transaction).toHaveBeenCalledTimes(1)
      expect(result.household.address1).toBe('456 New St')
    })

    it('should delete removed guests', async () => {
      mockDb.household.update.mockResolvedValue(mockHousehold)
      mockDb.guest.updateMany.mockResolvedValue({ count: 1 })
      mockDb.guest.deleteMany.mockResolvedValue({ count: 2 })
      mockDb.guest.upsert.mockResolvedValue(mockGuestWithInvitations)
      mockDb.guest.findUnique.mockResolvedValue(mockGuestWithInvitations)
      mockDb.invitation.update.mockResolvedValue(mockInvitation)
      mockDb.gift.upsert.mockResolvedValue(mockGift)

      await service.updateHouseholdWithGuests('wedding-123', {
        householdId: 'household-123',
        guestParty: [
          { guestId: 1, firstName: 'John', lastName: 'Doe', invites: { 'event-123': 'Attending' } },
        ],
        deletedGuests: [2, 3],
        gifts: [],
      })

      expect(mockDb.guest.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [2, 3] } },
      })
    })

    it('should not call deleteMany when no guests to delete', async () => {
      mockDb.household.update.mockResolvedValue(mockHousehold)
      mockDb.guest.updateMany.mockResolvedValue({ count: 1 })
      mockDb.guest.upsert.mockResolvedValue(mockGuestWithInvitations)
      mockDb.guest.findUnique.mockResolvedValue(mockGuestWithInvitations)
      mockDb.invitation.update.mockResolvedValue(mockInvitation)
      mockDb.gift.upsert.mockResolvedValue(mockGift)

      await service.updateHouseholdWithGuests('wedding-123', {
        householdId: 'household-123',
        guestParty: [
          { guestId: 1, firstName: 'John', lastName: 'Doe', invites: { 'event-123': 'Attending' } },
        ],
        gifts: [],
      })

      expect(mockDb.guest.deleteMany).not.toHaveBeenCalled()
    })

    it('should clear all primary contacts before upserting', async () => {
      mockDb.household.update.mockResolvedValue(mockHousehold)
      mockDb.guest.updateMany.mockResolvedValue({ count: 2 })
      mockDb.guest.upsert.mockResolvedValue(mockGuestWithInvitations)
      mockDb.guest.findUnique.mockResolvedValue(mockGuestWithInvitations)
      mockDb.invitation.update.mockResolvedValue(mockInvitation)
      mockDb.gift.upsert.mockResolvedValue(mockGift)

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

      expect(mockDb.guest.updateMany).toHaveBeenCalledWith({
        where: { householdId: 'household-123' },
        data: { isPrimaryContact: false },
      })
    })

    it('should upsert guests and update invitations', async () => {
      mockDb.household.update.mockResolvedValue(mockHousehold)
      mockDb.guest.updateMany.mockResolvedValue({ count: 1 })
      mockDb.guest.upsert.mockResolvedValue(mockGuestWithInvitations)
      mockDb.guest.findUnique.mockResolvedValue(mockGuestWithInvitations)
      mockDb.invitation.update.mockResolvedValue(mockInvitation)
      mockDb.gift.upsert.mockResolvedValue(mockGift)

      await service.updateHouseholdWithGuests('wedding-123', {
        householdId: 'household-123',
        guestParty: [
          { guestId: 1, firstName: 'John', lastName: 'Doe', invites: { 'event-123': 'Attending' } },
        ],
        gifts: [],
      })

      expect(mockDb.guest.upsert).toHaveBeenCalledTimes(1)
      expect(mockDb.invitation.update).toHaveBeenCalledWith({
        where: { guestId_eventId: { guestId: 1, eventId: 'event-123' } },
        data: { rsvp: 'Attending' },
      })
    })

    it('should upsert gifts', async () => {
      mockDb.household.update.mockResolvedValue(mockHousehold)
      mockDb.guest.updateMany.mockResolvedValue({ count: 1 })
      mockDb.guest.upsert.mockResolvedValue(mockGuestWithInvitations)
      mockDb.guest.findUnique.mockResolvedValue(mockGuestWithInvitations)
      mockDb.invitation.update.mockResolvedValue(mockInvitation)
      mockDb.gift.upsert.mockResolvedValue(mockGift)

      await service.updateHouseholdWithGuests('wedding-123', {
        householdId: 'household-123',
        guestParty: [
          { guestId: 1, firstName: 'John', lastName: 'Doe', invites: { 'event-123': 'Attending' } },
        ],
        gifts: [{ eventId: 'event-123', description: 'Kitchen set', thankyou: true }],
      })

      expect(mockDb.gift.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { GiftId: { householdId: 'household-123', eventId: 'event-123' } },
          create: expect.objectContaining({ description: 'Kitchen set', thankyou: true }),
          update: expect.objectContaining({ description: 'Kitchen set', thankyou: true }),
        })
      )
    })

    it('should delete non-allowed event invitations when guest is tag-along', async () => {
      mockDb.household.update.mockResolvedValue(mockHousehold)
      mockDb.guest.updateMany.mockResolvedValue({ count: 1 })
      mockDb.guest.upsert.mockResolvedValue(mockGuestWithInvitations)
      mockDb.guest.findUnique.mockResolvedValue(mockGuestWithInvitations)
      mockDb.invitation.update.mockResolvedValue(mockInvitation)
      mockDb.invitation.deleteMany.mockResolvedValue({ count: 1 })
      mockDb.gift.upsert.mockResolvedValue(mockGift)

      await service.updateHouseholdWithGuests('wedding-123', {
        householdId: 'household-123',
        guestParty: [
          {
            guestId: 5,
            firstName: 'Baby',
            lastName: 'Doe',
            isTagAlong: true,
            invites: { 'event-456': 'Invited' },
          },
        ],
        gifts: [],
      })

      expect(mockDb.invitation.deleteMany).toHaveBeenCalledWith({
        where: {
          guestId: 5,
          eventId: { notIn: ['event-456'] },
        },
      })
    })

    it('should delete all invitations when tag-along has no allowed events', async () => {
      mockDb.household.update.mockResolvedValue(mockHousehold)
      mockDb.guest.updateMany.mockResolvedValue({ count: 1 })
      mockDb.guest.upsert.mockResolvedValue(mockGuestWithInvitations)
      mockDb.guest.findUnique.mockResolvedValue(mockGuestWithInvitations)
      mockDb.invitation.deleteMany.mockResolvedValue({ count: 2 })
      mockDb.gift.upsert.mockResolvedValue(mockGift)

      await service.updateHouseholdWithGuests('wedding-123', {
        householdId: 'household-123',
        guestParty: [
          {
            guestId: 5,
            firstName: 'Baby',
            lastName: 'Doe',
            isTagAlong: true,
            invites: {},
          },
        ],
        gifts: [],
      })

      expect(mockDb.invitation.deleteMany).toHaveBeenCalledWith({
        where: { guestId: 5 },
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
