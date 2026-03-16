/**
 * Tests for HouseholdManagementService.bulkCreateHouseholds()
 *
 * Verifies sequencing, success counting, partial-failure propagation,
 * and the empty-array edge case.
 */

import { TRPCError } from '@trpc/server'

// Must mock before importing the service
jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))

jest.mock('~/server/domains/household/household.repository')
jest.mock('~/server/domains/guest/guest.repository')
jest.mock('~/server/domains/invitation/invitation.repository')
jest.mock('~/server/domains/gift/gift.repository')

// @ts-expect-error - Importing mock functions from mocked module
import { HouseholdManagementService } from '~/server/application/household-management/household-management.service'
import { requirePermission } from '~/server/authz/permission-checker'
import { GiftRepository, resetMocks as resetGiftMocks } from '~/server/domains/gift/gift.repository'
// @ts-expect-error - Importing mock functions from mocked module
import {
  GuestRepository,
  mockBelongsToWedding as mockGuestBelongsToWedding,
  resetMocks as resetGuestMocks,
} from '~/server/domains/guest/guest.repository'
// @ts-expect-error - Importing mock functions from mocked module
import {
  HouseholdRepository,
  resetMocks as resetHouseholdMocks,
} from '~/server/domains/household/household.repository'
// @ts-expect-error - Importing mock functions from mocked module
import {
  InvitationRepository,
  mockEventBelongsToWedding,
  resetMocks as resetInvitationMocks,
} from '~/server/domains/invitation/invitation.repository'

const mockRequirePermission = requirePermission as jest.Mock
const mockGuestBelongsToWeddingFn = mockGuestBelongsToWedding as jest.Mock
const mockEventBelongsToWeddingFn = mockEventBelongsToWedding as jest.Mock

// Mock guest returned from tx.guest.create / findUnique
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
  invitations: [],
  guestTagAssignments: [],
}

// Mock household returned from tx.household.create
const mockCreatedHousehold = {
  id: 'household-1',
  address1: null,
  address2: null,
  city: null,
  state: null,
  country: null,
  zipCode: null,
  notes: null,
  guests: [],
  gifts: [],
}

// Create a mock transaction with all required Prisma models
const createMockTx = () => ({
  household: {
    create: jest.fn().mockResolvedValue(mockCreatedHousehold),
  },
  guest: {
    create: jest.fn().mockResolvedValue(mockCreatedGuest),
    findUnique: jest.fn().mockResolvedValue(mockCreatedGuest),
    updateMany: jest.fn(),
  },
  guestTagAssignment: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
})

type MockTx = ReturnType<typeof createMockTx>

const createMockDb = (mockTx: MockTx) => ({
  $transaction: jest.fn((callback: (tx: MockTx) => Promise<unknown>) => callback(mockTx)),
  guest: { updateMany: jest.fn() },
  guestTagAssignment: { createMany: jest.fn(), deleteMany: jest.fn() },
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
  let mockTx: MockTx
  const actorContext = {
    headers: new Headers(),
    userId: 'actor-1',
    sessionActiveOrganizationId: null,
  }

  beforeEach(() => {
    resetHouseholdMocks()
    resetGuestMocks()
    resetInvitationMocks()
    resetGiftMocks()
    mockRequirePermission.mockReset()
    mockRequirePermission.mockResolvedValue({ organizationId: 'org-1', role: 'admin' })
    mockGuestBelongsToWeddingFn.mockResolvedValue(true)
    mockEventBelongsToWeddingFn.mockResolvedValue(true)
    mockTx = createMockTx()
    const mockDb = createMockDb(mockTx)

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

    it('should call tx.household.create once per household', async () => {
      await service.bulkCreateHouseholds(actorContext, 'wedding-123', [
        SINGLE_GUEST_HOUSEHOLD,
        SECOND_HOUSEHOLD,
      ])

      expect(mockTx.household.create).toHaveBeenCalledTimes(2)
    })

    it('should forward the weddingId to each household creation', async () => {
      await service.bulkCreateHouseholds(actorContext, 'wedding-xyz', [SINGLE_GUEST_HOUSEHOLD])

      expect(mockTx.household.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ weddingId: 'wedding-xyz' }),
        })
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
      expect(mockTx.household.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            address1: '123 Main St',
            city: 'New York',
            state: 'NY',
          }),
        })
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

      expect(mockTx.household.create).not.toHaveBeenCalled()
      expect(mockTx.guest.create).not.toHaveBeenCalled()
    })
  })

  describe('partial failure', () => {
    it('should rethrow FORBIDDEN errors from nested household authorization checks', async () => {
      mockEventBelongsToWeddingFn.mockResolvedValue(false)

      await expect(
        service.bulkCreateHouseholds(actorContext, 'wedding-123', [SINGLE_GUEST_HOUSEHOLD])
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })

    it('should count the second household as failed when tx.household.create returns null', async () => {
      mockTx.household.create
        .mockResolvedValueOnce(mockCreatedHousehold) // household #1 succeeds
        .mockResolvedValueOnce(null) // household #2 returns null → TRPCError

      const result = await service.bulkCreateHouseholds(actorContext, 'wedding-123', [
        SINGLE_GUEST_HOUSEHOLD,
        SECOND_HOUSEHOLD,
      ])

      expect(result).toEqual({ created: 1, failed: 1 })
    })

    it('should continue processing after a failure and report all results', async () => {
      let createCallCount = 0
      mockTx.household.create.mockImplementation(() => {
        createCallCount++
        if (createCallCount === 2) return Promise.resolve(null) // household #2 fails
        return Promise.resolve(mockCreatedHousehold)
      })

      const result = await service.bulkCreateHouseholds(actorContext, 'wedding-123', [
        SINGLE_GUEST_HOUSEHOLD,
        SECOND_HOUSEHOLD,
        { guestParty: [{ firstName: 'Third', lastName: 'Guest', invites: {} }] },
      ])

      // All three are attempted; #1 and #3 succeed, #2 fails
      expect(mockTx.household.create).toHaveBeenCalledTimes(3)
      expect(result).toEqual({ created: 2, failed: 1 })
    })

    it('should count guest creation failure in failed tally', async () => {
      // Simulate guest refetch returning null → TRPCError inside createHouseholdWithGuests
      mockTx.guest.findUnique.mockResolvedValue(null)

      const result = await service.bulkCreateHouseholds(actorContext, 'wedding-123', [
        SINGLE_GUEST_HOUSEHOLD,
      ])

      expect(result).toEqual({ created: 0, failed: 1 })
    })

    it('should not throw when all households fail', async () => {
      mockTx.household.create.mockRejectedValue(new Error('DB down'))

      const result = await service.bulkCreateHouseholds(actorContext, 'wedding-123', [
        SINGLE_GUEST_HOUSEHOLD,
        SECOND_HOUSEHOLD,
      ])

      expect(result).toEqual({ created: 0, failed: 2 })
    })

    it('should count TRPCError from createHouseholdWithGuests as a failure', async () => {
      mockTx.household.create.mockRejectedValue(
        new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something broke' })
      )

      const result = await service.bulkCreateHouseholds(actorContext, 'wedding-123', [
        SINGLE_GUEST_HOUSEHOLD,
      ])

      expect(result).toEqual({ created: 0, failed: 1 })
    })
  })
})
