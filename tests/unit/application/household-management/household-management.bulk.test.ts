/**
 * Tests for HouseholdManagementService.bulkCreateHouseholds()
 */

import { TRPCError } from '@trpc/server'

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))

jest.mock('~/server/domains/household/household.repository')
jest.mock('~/server/domains/guest/guest.repository')
jest.mock('~/server/domains/invitation/invitation.repository')
jest.mock('~/server/domains/gift/gift.repository')
jest.mock('~/server/domains/website/website.repository')

import { HouseholdManagementService } from '~/server/application/household-management/household-management.service'
import { requirePermission } from '~/server/authz/permission-checker'
import { GiftRepository, resetMocks as resetGiftMocks } from '~/server/domains/gift/gift.repository'
import {
  GuestRepository,
  mockBelongsToWedding as mockGuestBelongsToWedding,
  mockCreate as mockGuestCreate,
  mockFindByIdWithInvitations as mockGuestFindByIdWithInvitations,
  resetMocks as resetGuestMocks,
} from '~/server/domains/guest/guest.repository'
import {
  HouseholdRepository,
  mockCreateWithGifts,
  resetMocks as resetHouseholdMocks,
} from '~/server/domains/household/household.repository'
import {
  InvitationRepository,
  mockEventBelongsToWedding,
  resetMocks as resetInvitationMocks,
} from '~/server/domains/invitation/invitation.repository'
import { WebsiteRepository } from '~/server/domains/website/website.repository'

const mockRequirePermission = requirePermission as jest.Mock
const mockGuestBelongsToWeddingFn = mockGuestBelongsToWedding as jest.Mock
const mockEventBelongsToWeddingFn = mockEventBelongsToWedding as jest.Mock

const mockCreatedHousehold = {
  id: 'household-1',
  weddingId: 'wedding-123',
  address1: null,
  address2: null,
  city: null,
  state: null,
  country: null,
  zipCode: null,
  likelihoodOfAttending: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  guests: [],
  gifts: [],
}

const mockCreatedGuest = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: null,
  phone: null,
  isPrimaryContact: true,
  isTagAlong: false,
  ageGroup: null,
  householdId: 'household-1',
  weddingId: 'wedding-123',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockGuestWithInvitations = {
  ...mockCreatedGuest,
  invitations: [],
  guestTagAssignments: [],
}

const createMockDb = () => ({
  $transaction: jest
    .fn()
    .mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({ __tx: true })
    ),
})

const SINGLE_GUEST_HOUSEHOLD = {
  guestParty: [
    {
      firstName: 'John',
      lastName: 'Doe',
      invites: { 'event-123': 'Invited' },
    },
  ],
}

const SECOND_HOUSEHOLD = {
  guestParty: [
    {
      firstName: 'Jane',
      lastName: 'Smith',
      invites: { 'event-123': 'Invited' },
    },
  ],
}

describe('HouseholdManagementService.bulkCreateHouseholds()', () => {
  let service: HouseholdManagementService
  let mockDb: ReturnType<typeof createMockDb>

  const actorContext = {
    userId: 'actor-1',
    activeOrganization: null,
  }

  beforeEach(() => {
    resetHouseholdMocks()
    resetGuestMocks()
    resetInvitationMocks()
    resetGiftMocks()

    mockDb = createMockDb()

    mockRequirePermission.mockReset()
    mockRequirePermission.mockReturnValue({ organizationId: 'org-1', role: 'admin' })
    mockGuestBelongsToWeddingFn.mockResolvedValue(true)
    mockEventBelongsToWeddingFn.mockResolvedValue(true)

    mockCreateWithGifts.mockResolvedValue(mockCreatedHousehold)
    mockGuestCreate.mockResolvedValue(mockCreatedGuest)
    mockGuestFindByIdWithInvitations.mockResolvedValue(mockGuestWithInvitations)

    const mockHouseholdRepo = new HouseholdRepository({} as never)
    const mockGuestRepo = new GuestRepository({} as never)
    const mockInvitationRepo = new InvitationRepository({} as never)
    const mockGiftRepo = new GiftRepository({} as never)
    const mockWebsiteRepo = new WebsiteRepository({} as never)

    service = new HouseholdManagementService(
      mockHouseholdRepo,
      mockGuestRepo,
      mockInvitationRepo,
      mockGiftRepo,
      mockWebsiteRepo,
      mockDb as never
    )
  })

  describe('success cases', () => {
    it('should return { created: 1 } for a single household', async () => {
      const result = await service.bulkCreateHouseholds(actorContext, 'wedding-123', [
        SINGLE_GUEST_HOUSEHOLD,
      ])

      expect(result).toEqual({ created: 1, failed: 0 })
    })

    it('should return { created: 2 } when two households succeed', async () => {
      const result = await service.bulkCreateHouseholds(actorContext, 'wedding-123', [
        SINGLE_GUEST_HOUSEHOLD,
        SECOND_HOUSEHOLD,
      ])

      expect(result).toEqual({ created: 2, failed: 0 })
    })

    it('should call createWithGifts once per household', async () => {
      await service.bulkCreateHouseholds(actorContext, 'wedding-123', [
        SINGLE_GUEST_HOUSEHOLD,
        SECOND_HOUSEHOLD,
      ])

      expect(mockCreateWithGifts).toHaveBeenCalledTimes(2)
    })

    it('should forward the weddingId to each household creation', async () => {
      await service.bulkCreateHouseholds(actorContext, 'wedding-xyz', [SINGLE_GUEST_HOUSEHOLD])

      expect(mockCreateWithGifts).toHaveBeenCalledWith(
        expect.objectContaining({ weddingId: 'wedding-xyz' }),
        ['event-123']
      )
    })

    it('should process households with address fields', async () => {
      const householdWithAddress = {
        address1: '123 Main St',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001',
        guestParty: [
          {
            firstName: 'Alice',
            lastName: 'Walker',
            invites: { 'event-123': 'Invited' },
          },
        ],
      }

      const result = await service.bulkCreateHouseholds(actorContext, 'wedding-123', [
        householdWithAddress,
      ])

      expect(result).toEqual({ created: 1, failed: 0 })
      expect(mockCreateWithGifts).toHaveBeenCalledWith(
        expect.objectContaining({
          address1: '123 Main St',
          city: 'New York',
          state: 'NY',
        }),
        ['event-123']
      )
    })
  })

  describe('empty array', () => {
    it('should return { created: 0 } for an empty households array', async () => {
      const result = await service.bulkCreateHouseholds(actorContext, 'wedding-123', [])

      expect(result).toEqual({ created: 0, failed: 0 })
    })

    it('should not call the database when given an empty array', async () => {
      await service.bulkCreateHouseholds(actorContext, 'wedding-123', [])

      expect(mockDb.$transaction).not.toHaveBeenCalled()
    })
  })

  describe('partial failure', () => {
    it('should rethrow FORBIDDEN errors from nested household authorization checks', async () => {
      mockEventBelongsToWeddingFn.mockResolvedValue(false)

      await expect(
        service.bulkCreateHouseholds(actorContext, 'wedding-123', [SINGLE_GUEST_HOUSEHOLD])
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })

    it('should count the second household as failed when household creation returns null', async () => {
      mockCreateWithGifts.mockResolvedValueOnce(mockCreatedHousehold).mockResolvedValueOnce(null)

      const result = await service.bulkCreateHouseholds(actorContext, 'wedding-123', [
        SINGLE_GUEST_HOUSEHOLD,
        SECOND_HOUSEHOLD,
      ])

      expect(result).toEqual({ created: 1, failed: 1 })
    })

    it('should continue processing after a failure and report all results', async () => {
      let createCallCount = 0
      mockCreateWithGifts.mockImplementation(() => {
        createCallCount++
        if (createCallCount === 2) return Promise.resolve(null)
        return Promise.resolve(mockCreatedHousehold)
      })

      const result = await service.bulkCreateHouseholds(actorContext, 'wedding-123', [
        SINGLE_GUEST_HOUSEHOLD,
        SECOND_HOUSEHOLD,
        { guestParty: [{ firstName: 'Third', lastName: 'Guest', invites: {} }] },
      ])

      expect(mockCreateWithGifts).toHaveBeenCalledTimes(3)
      expect(result).toEqual({ created: 2, failed: 1 })
    })

    it('should count guest creation failure in failed tally', async () => {
      mockGuestFindByIdWithInvitations.mockResolvedValue(null)

      const result = await service.bulkCreateHouseholds(actorContext, 'wedding-123', [
        SINGLE_GUEST_HOUSEHOLD,
      ])

      expect(result).toEqual({ created: 0, failed: 1 })
    })

    it('should not throw when all households fail', async () => {
      mockCreateWithGifts.mockRejectedValue(new Error('DB down'))

      const result = await service.bulkCreateHouseholds(actorContext, 'wedding-123', [
        SINGLE_GUEST_HOUSEHOLD,
        SECOND_HOUSEHOLD,
      ])

      expect(result).toEqual({ created: 0, failed: 2 })
    })

    it('should count TRPCError from createHouseholdWithGuests as a failure', async () => {
      mockCreateWithGifts.mockRejectedValue(
        new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something broke' })
      )

      const result = await service.bulkCreateHouseholds(actorContext, 'wedding-123', [
        SINGLE_GUEST_HOUSEHOLD,
      ])

      expect(result).toEqual({ created: 0, failed: 1 })
    })
  })
})
