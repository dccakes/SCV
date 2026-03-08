/**
 * Tests for HouseholdManagementService.bulkCreateHouseholds()
 *
 * Verifies sequencing, success counting, partial-failure propagation,
 * and the empty-array edge case.
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
  resetMocks as resetGiftMocks,
} from '~/server/domains/gift/gift.repository'
// @ts-expect-error - Importing mock functions from mocked module
import {
  GuestRepository,
  mockCreate,
  mockFindByIdWithInvitations,
  mockGuestWithInvitations,
  resetMocks as resetGuestMocks,
} from '~/server/domains/guest/guest.repository'
// @ts-expect-error - Importing mock functions from mocked module
import {
  HouseholdRepository,
  mockCreateWithGifts,
  mockHousehold,
  resetMocks as resetHouseholdMocks,
} from '~/server/domains/household/household.repository'
// @ts-expect-error - Importing mock functions from mocked module
import {
  InvitationRepository,
  resetMocks as resetInvitationMocks,
} from '~/server/domains/invitation/invitation.repository'

// Create typed aliases for mock functions
const mockCreateWithGiftsFn = mockCreateWithGifts as jest.Mock
const mockCreateFn = mockCreate as jest.Mock
const mockFindByIdWithInvitationsFn = mockFindByIdWithInvitations as jest.Mock

// Minimal Prisma mock (guestTagAssignment is not exercised by bulkCreateHouseholds
// but the constructor requires it)
const createMockDb = () => ({
  guest: {
    updateMany: jest.fn(),
  },
  guestTagAssignment: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
})

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HouseholdManagementService.bulkCreateHouseholds()', () => {
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

  describe('success cases', () => {
    it('should return { created: 1 } for a single household', async () => {
      mockCreateWithGiftsFn.mockResolvedValue(mockHousehold)
      mockCreateFn.mockResolvedValue(mockGuestWithInvitations)
      mockFindByIdWithInvitationsFn.mockResolvedValue(mockGuestWithInvitations)

      const result = await service.bulkCreateHouseholds('wedding-123', [SINGLE_GUEST_HOUSEHOLD])

      expect(result).toEqual({ created: 1 })
    })

    it('should return { created: 2 } when two households succeed', async () => {
      mockCreateWithGiftsFn.mockResolvedValue(mockHousehold)
      mockCreateFn.mockResolvedValue(mockGuestWithInvitations)
      mockFindByIdWithInvitationsFn.mockResolvedValue(mockGuestWithInvitations)

      const result = await service.bulkCreateHouseholds('wedding-123', [
        SINGLE_GUEST_HOUSEHOLD,
        SECOND_HOUSEHOLD,
      ])

      expect(result).toEqual({ created: 2 })
    })

    it('should call createHouseholdWithGuests once per household', async () => {
      mockCreateWithGiftsFn.mockResolvedValue(mockHousehold)
      mockCreateFn.mockResolvedValue(mockGuestWithInvitations)
      mockFindByIdWithInvitationsFn.mockResolvedValue(mockGuestWithInvitations)

      await service.bulkCreateHouseholds('wedding-123', [SINGLE_GUEST_HOUSEHOLD, SECOND_HOUSEHOLD])

      // createWithGifts is called once per household creation
      expect(mockCreateWithGiftsFn).toHaveBeenCalledTimes(2)
    })

    it('should forward the weddingId to each household creation', async () => {
      mockCreateWithGiftsFn.mockResolvedValue(mockHousehold)
      mockCreateFn.mockResolvedValue(mockGuestWithInvitations)
      mockFindByIdWithInvitationsFn.mockResolvedValue(mockGuestWithInvitations)

      await service.bulkCreateHouseholds('wedding-xyz', [SINGLE_GUEST_HOUSEHOLD])

      // The service passes weddingId inside the data object to createWithGifts
      expect(mockCreateWithGiftsFn).toHaveBeenCalledWith(
        expect.objectContaining({ weddingId: 'wedding-xyz' }),
        expect.any(Array)
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

      mockCreateWithGiftsFn.mockResolvedValue(mockHousehold)
      mockCreateFn.mockResolvedValue(mockGuestWithInvitations)
      mockFindByIdWithInvitationsFn.mockResolvedValue(mockGuestWithInvitations)

      const result = await service.bulkCreateHouseholds('wedding-123', [householdWithAddress])

      expect(result).toEqual({ created: 1 })
      expect(mockCreateWithGiftsFn).toHaveBeenCalledWith(
        expect.objectContaining({
          address1: '123 Main St',
          city: 'New York',
          state: 'NY',
        }),
        expect.any(Array)
      )
    })
  })

  describe('empty array', () => {
    it('should return { created: 0 } for an empty households array', async () => {
      const result = await service.bulkCreateHouseholds('wedding-123', [])

      expect(result).toEqual({ created: 0 })
    })

    it('should not call the household repository when given an empty array', async () => {
      await service.bulkCreateHouseholds('wedding-123', [])

      expect(mockCreateWithGiftsFn).not.toHaveBeenCalled()
      expect(mockCreateFn).not.toHaveBeenCalled()
    })
  })

  describe('partial failure', () => {
    it('should propagate a TRPCError thrown by the second household and stop processing', async () => {
      // First household succeeds
      mockCreateWithGiftsFn
        .mockResolvedValueOnce(mockHousehold) // household #1 creation succeeds
        .mockResolvedValueOnce(null)           // household #2 creation returns null → TRPCError

      mockCreateFn.mockResolvedValue(mockGuestWithInvitations)
      mockFindByIdWithInvitationsFn.mockResolvedValue(mockGuestWithInvitations)

      await expect(
        service.bulkCreateHouseholds('wedding-123', [SINGLE_GUEST_HOUSEHOLD, SECOND_HOUSEHOLD])
      ).rejects.toThrow(TRPCError)
    })

    it('should only have created 1 household when the second fails', async () => {
      // Track calls before the rejection
      let createCallCount = 0
      mockCreateWithGiftsFn.mockImplementation(() => {
        createCallCount++
        if (createCallCount === 1) return Promise.resolve(mockHousehold)
        return Promise.resolve(null) // triggers TRPCError on second call
      })

      mockCreateFn.mockResolvedValue(mockGuestWithInvitations)
      mockFindByIdWithInvitationsFn.mockResolvedValue(mockGuestWithInvitations)

      await expect(
        service.bulkCreateHouseholds('wedding-123', [
          SINGLE_GUEST_HOUSEHOLD,
          SECOND_HOUSEHOLD,
          // A third household that should never be reached
          { guestParty: [{ firstName: 'Never', lastName: 'Reached', invites: {} }] },
        ])
      ).rejects.toThrow(TRPCError)

      // createWithGifts called for #1 (succeeds) and #2 (fails); #3 never reached
      expect(mockCreateWithGiftsFn).toHaveBeenCalledTimes(2)
    })

    it('should propagate a TRPCError when the guest creation fails', async () => {
      mockCreateWithGiftsFn.mockResolvedValue(mockHousehold)
      // Simulate guest refetch returning null → TRPCError
      mockCreateFn.mockResolvedValue(mockGuestWithInvitations)
      mockFindByIdWithInvitationsFn.mockResolvedValue(null)

      await expect(
        service.bulkCreateHouseholds('wedding-123', [SINGLE_GUEST_HOUSEHOLD])
      ).rejects.toThrow(TRPCError)
    })
  })
})
