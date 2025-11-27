/**
 * Tests for Household Management Application Service
 *
 * This service orchestrates cross-domain operations for household management.
 * Tests verify the service correctly coordinates multiple domain operations.
 */

import { TRPCError } from '@trpc/server'

import { HouseholdManagementService } from '~/server/application/household-management/household-management.service'

// Mock data
const mockHousehold = {
  id: 'household-123',
  userId: 'user-123',
  address1: '123 Main St',
  address2: null,
  city: 'New York',
  state: 'NY',
  country: 'USA',
  zipCode: '10001',
  phone: '555-1234',
  email: 'family@example.com',
  notes: null,
  gifts: [
    { householdId: 'household-123', eventId: 'event-123', description: null, thankyou: false },
  ],
}

const mockGuest = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  isPrimaryContact: true,
  householdId: 'household-123',
  userId: 'user-123',
  invitations: [
    {
      guestId: 1,
      eventId: 'event-123',
      rsvp: 'Invited',
      invitedAt: null,
      updatedAt: new Date(),
      userId: 'user-123',
    },
  ],
}

const mockInvitation = {
  guestId: 1,
  eventId: 'event-123',
  rsvp: 'Attending',
  invitedAt: null,
  updatedAt: new Date(),
  userId: 'user-123',
}

const mockGift = {
  householdId: 'household-123',
  eventId: 'event-123',
  description: 'Kitchen set',
  thankyou: true,
}

// Create mock Prisma client
const createMockDb = () => ({
  household: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  guest: {
    create: jest.fn(),
    upsert: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  invitation: {
    update: jest.fn(),
  },
  gift: {
    upsert: jest.fn(),
  },
})

// Create mock domain services (not used directly but required for constructor)
const createMockDomainServices = () => ({
  householdService: {},
  guestService: {},
  invitationService: {},
  eventService: {},
  giftService: {},
})

describe('HouseholdManagementService', () => {
  let service: HouseholdManagementService
  let mockDb: ReturnType<typeof createMockDb>
  let mockServices: ReturnType<typeof createMockDomainServices>

  beforeEach(() => {
    mockDb = createMockDb()
    mockServices = createMockDomainServices()
    service = new HouseholdManagementService(
      mockServices.householdService as never,
      mockServices.guestService as never,
      mockServices.invitationService as never,
      mockServices.eventService as never,
      mockServices.giftService as never,
      mockDb as never
    )
  })

  describe('createHouseholdWithGuests', () => {
    it('should create a household with guests and invitations', async () => {
      mockDb.household.create.mockResolvedValue(mockHousehold)
      mockDb.guest.create.mockResolvedValue(mockGuest)

      const result = await service.createHouseholdWithGuests('user-123', {
        address1: '123 Main St',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001',
        email: 'family@example.com',
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
      expect(mockDb.household.create).toHaveBeenCalledTimes(1)
      expect(mockDb.guest.create).toHaveBeenCalledTimes(1)
    })

    it('should create multiple guests for a household', async () => {
      mockDb.household.create.mockResolvedValue(mockHousehold)
      mockDb.guest.create
        .mockResolvedValueOnce({ ...mockGuest, isPrimaryContact: true })
        .mockResolvedValueOnce({
          ...mockGuest,
          id: 2,
          firstName: 'Jane',
          isPrimaryContact: false,
        })

      const result = await service.createHouseholdWithGuests('user-123', {
        guestParty: [
          { firstName: 'John', lastName: 'Doe', invites: { 'event-123': 'Invited' } },
          { firstName: 'Jane', lastName: 'Doe', invites: { 'event-123': 'Invited' } },
        ],
      })

      expect(result.guests).toHaveLength(2)
      expect(mockDb.guest.create).toHaveBeenCalledTimes(2)
    })

    it('should set first guest as primary contact', async () => {
      mockDb.household.create.mockResolvedValue(mockHousehold)
      mockDb.guest.create.mockResolvedValue(mockGuest)

      await service.createHouseholdWithGuests('user-123', {
        guestParty: [
          { firstName: 'John', lastName: 'Doe', invites: {} },
          { firstName: 'Jane', lastName: 'Doe', invites: {} },
        ],
      })

      // First call should have isPrimaryContact: true
      expect(mockDb.guest.create.mock.calls[0][0].data.isPrimaryContact).toBe(true)
      // Second call should have isPrimaryContact: false
      expect(mockDb.guest.create.mock.calls[1][0].data.isPrimaryContact).toBe(false)
    })

    it('should create gifts for each event', async () => {
      mockDb.household.create.mockResolvedValue(mockHousehold)
      mockDb.guest.create.mockResolvedValue(mockGuest)

      await service.createHouseholdWithGuests('user-123', {
        guestParty: [
          {
            firstName: 'John',
            lastName: 'Doe',
            invites: { 'event-123': 'Invited', 'event-456': 'Invited' },
          },
        ],
      })

      // Verify household.create was called with gifts for both events
      const createCall = mockDb.household.create.mock.calls[0][0]
      expect(createCall.data.gifts.createMany.data).toHaveLength(2)
    })

    it('should throw error if household creation fails', async () => {
      mockDb.household.create.mockResolvedValue(null)

      await expect(
        service.createHouseholdWithGuests('user-123', {
          guestParty: [{ firstName: 'John', lastName: 'Doe', invites: {} }],
        })
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('updateHouseholdWithGuests', () => {
    it('should update household details', async () => {
      const updatedHousehold = { ...mockHousehold, address1: '456 New St' }
      mockDb.household.update.mockResolvedValue(updatedHousehold)
      mockDb.guest.updateMany.mockResolvedValue({ count: 1 })
      mockDb.guest.upsert.mockResolvedValue(mockGuest)
      mockDb.invitation.update.mockResolvedValue(mockInvitation)
      mockDb.gift.upsert.mockResolvedValue(mockGift)

      const result = await service.updateHouseholdWithGuests('user-123', {
        householdId: 'household-123',
        address1: '456 New St',
        guestParty: [
          { guestId: 1, firstName: 'John', lastName: 'Doe', invites: { 'event-123': 'Attending' } },
        ],
        gifts: [{ eventId: 'event-123', description: 'Kitchen set', thankyou: true }],
      })

      expect(result.household.address1).toBe('456 New St')
      expect(mockDb.household.update).toHaveBeenCalledWith({
        where: { id: 'household-123' },
        data: expect.objectContaining({ address1: '456 New St' }),
      })
    })

    it('should delete removed guests', async () => {
      mockDb.household.update.mockResolvedValue(mockHousehold)
      mockDb.guest.updateMany.mockResolvedValue({ count: 1 })
      mockDb.guest.deleteMany.mockResolvedValue({ count: 2 })
      mockDb.guest.upsert.mockResolvedValue(mockGuest)
      mockDb.invitation.update.mockResolvedValue(mockInvitation)
      mockDb.gift.upsert.mockResolvedValue(mockGift)

      await service.updateHouseholdWithGuests('user-123', {
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
      mockDb.guest.upsert.mockResolvedValue(mockGuest)
      mockDb.invitation.update.mockResolvedValue(mockInvitation)
      mockDb.gift.upsert.mockResolvedValue(mockGift)

      await service.updateHouseholdWithGuests('user-123', {
        householdId: 'household-123',
        guestParty: [
          { guestId: 1, firstName: 'John', lastName: 'Doe', invites: { 'event-123': 'Attending' } },
        ],
        gifts: [],
      })

      expect(mockDb.guest.deleteMany).not.toHaveBeenCalled()
    })

    it('should upsert guests and update invitations', async () => {
      mockDb.household.update.mockResolvedValue(mockHousehold)
      mockDb.guest.updateMany.mockResolvedValue({ count: 1 })
      mockDb.guest.upsert.mockResolvedValue(mockGuest)
      mockDb.invitation.update.mockResolvedValue(mockInvitation)
      mockDb.gift.upsert.mockResolvedValue(mockGift)

      await service.updateHouseholdWithGuests('user-123', {
        householdId: 'household-123',
        guestParty: [
          { guestId: 1, firstName: 'John', lastName: 'Doe', invites: { 'event-123': 'Attending' } },
        ],
        gifts: [],
      })

      expect(mockDb.guest.upsert).toHaveBeenCalledTimes(1)
      expect(mockDb.invitation.update).toHaveBeenCalledWith({
        where: { guestId_eventId: { eventId: 'event-123', guestId: 1 } },
        data: { rsvp: 'Attending' },
      })
    })

    it('should upsert gifts', async () => {
      mockDb.household.update.mockResolvedValue(mockHousehold)
      mockDb.guest.updateMany.mockResolvedValue({ count: 1 })
      mockDb.guest.upsert.mockResolvedValue(mockGuest)
      mockDb.invitation.update.mockResolvedValue(mockInvitation)
      mockDb.gift.upsert.mockResolvedValue(mockGift)

      await service.updateHouseholdWithGuests('user-123', {
        householdId: 'household-123',
        guestParty: [
          { guestId: 1, firstName: 'John', lastName: 'Doe', invites: { 'event-123': 'Attending' } },
        ],
        gifts: [{ eventId: 'event-123', description: 'Kitchen set', thankyou: true }],
      })

      expect(mockDb.gift.upsert).toHaveBeenCalledWith({
        where: { GiftId: { eventId: 'event-123', householdId: 'household-123' } },
        update: { description: 'Kitchen set', thankyou: true },
        create: {
          householdId: 'household-123',
          eventId: 'event-123',
          description: 'Kitchen set',
          thankyou: true,
        },
      })
    })
  })

  describe('deleteHousehold', () => {
    it('should delete a household and return its id', async () => {
      mockDb.household.delete.mockResolvedValue(mockHousehold)

      const result = await service.deleteHousehold('household-123')

      expect(result).toBe('household-123')
      expect(mockDb.household.delete).toHaveBeenCalledWith({
        where: { id: 'household-123' },
      })
    })

    it('should call delete with correct householdId', async () => {
      mockDb.household.delete.mockResolvedValue({ id: 'another-household' })

      await service.deleteHousehold('another-household')

      expect(mockDb.household.delete).toHaveBeenCalledWith({
        where: { id: 'another-household' },
      })
    })
  })
})
