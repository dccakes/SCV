/**
 * Tests for Household Management Application Service
 */

import { TRPCError } from '@trpc/server'

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))

jest.mock('~/server/domains/household/household.repository')
jest.mock('~/server/domains/guest/guest.repository')
jest.mock('~/server/domains/invitation/invitation.repository')
jest.mock('~/server/domains/gift/gift.repository')

import { HouseholdManagementService } from '~/server/application/household-management/household-management.service'
import { requirePermission } from '~/server/authz/permission-checker'
import {
  GiftRepository,
  mockUpsert as mockGiftUpsert,
  resetMocks as resetGiftMocks,
} from '~/server/domains/gift/gift.repository'
import {
  GuestRepository,
  mockClearPrimaryContactsByHousehold,
  mockBelongsToWedding as mockGuestBelongsToWedding,
  mockCreate as mockGuestCreate,
  mockDeleteMany as mockGuestDeleteMany,
  mockFindByIdWithInvitations as mockGuestFindByIdWithInvitations,
  mockUpdateTags as mockGuestUpdateTags,
  mockUpsert as mockGuestUpsert,
  resetMocks as resetGuestMocks,
} from '~/server/domains/guest/guest.repository'
import {
  HouseholdRepository,
  mockBelongsToWedding,
  mockCreateWithGifts,
  mockDelete,
  mockHousehold,
  mockUpdate,
  resetMocks as resetHouseholdMocks,
} from '~/server/domains/household/household.repository'
import {
  InvitationRepository,
  mockDeleteByGuest,
  mockDeleteByGuestExcludingEvents,
  mockEventBelongsToWedding,
  mockInvitation,
  mockUpdate as mockInvitationUpdate,
  resetMocks as resetInvitationMocks,
} from '~/server/domains/invitation/invitation.repository'

const mockRequirePermission = requirePermission as jest.Mock
const mockBelongsToWeddingFn = mockBelongsToWedding as jest.Mock
const mockGuestBelongsToWeddingFn = mockGuestBelongsToWedding as jest.Mock
const mockEventBelongsToWeddingFn = mockEventBelongsToWedding as jest.Mock

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

const createMockDb = () => ({
  $transaction: jest.fn().mockImplementation(async (fn: (tx: unknown) => unknown) => {
    return fn({ __tx: true })
  }),
})

describe('HouseholdManagementService', () => {
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

    mockBelongsToWeddingFn.mockResolvedValue(true)
    mockGuestBelongsToWeddingFn.mockResolvedValue(true)
    mockEventBelongsToWeddingFn.mockResolvedValue(true)

    mockCreateWithGifts.mockResolvedValue({ ...mockHousehold, guests: [], gifts: [] })
    mockUpdate.mockResolvedValue(mockHousehold)
    mockGuestCreate.mockResolvedValue(mockGuestWithInvitations)
    mockGuestUpsert.mockResolvedValue(mockGuestWithInvitations)
    mockGuestFindByIdWithInvitations.mockResolvedValue(mockGuestWithInvitations)
    mockGiftUpsert.mockResolvedValue({
      householdId: 'household-123',
      eventId: 'event-123',
      description: 'desc',
      thankyou: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    mockDelete.mockResolvedValue(mockHousehold)

    const householdRepo = new HouseholdRepository({} as never)
    const guestRepo = new GuestRepository({} as never)
    const invitationRepo = new InvitationRepository({} as never)
    const giftRepo = new GiftRepository({} as never)

    service = new HouseholdManagementService(
      householdRepo,
      guestRepo,
      invitationRepo,
      giftRepo,
      mockDb as never
    )
  })

  it('rejects create when actor lacks guest create permission', async () => {
    mockRequirePermission.mockImplementation(() => {
      throw new TRPCError({ code: 'FORBIDDEN' })
    })

    await expect(
      service.createHouseholdWithGuests(actorContext, 'wedding-123', {
        guestParty: [{ firstName: 'John', lastName: 'Doe', invites: {} }],
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    expect(mockDb.$transaction).not.toHaveBeenCalled()
  })

  it('rejects create when invitation event is outside wedding scope', async () => {
    mockEventBelongsToWeddingFn.mockResolvedValue(false)

    await expect(
      service.createHouseholdWithGuests(actorContext, 'wedding-123', {
        guestParty: [{ firstName: 'John', lastName: 'Doe', invites: { 'event-out': 'Invited' } }],
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    expect(mockDb.$transaction).not.toHaveBeenCalled()
  })

  it('creates household and guests using repositories inside a transaction', async () => {
    await service.createHouseholdWithGuests(actorContext, 'wedding-123', {
      address1: '123 Main St',
      guestParty: [
        { firstName: 'John', lastName: 'Doe', invites: { 'event-123': 'Invited' } },
        {
          firstName: 'Baby',
          lastName: 'Doe',
          isTagAlong: true,
          isPrimaryContact: true,
          invites: { 'event-123': 'Invited' },
        },
      ],
    })

    expect(mockDb.$transaction).toHaveBeenCalledTimes(1)
    expect(mockCreateWithGifts).toHaveBeenCalledWith(
      expect.objectContaining({ weddingId: 'wedding-123' }),
      ['event-123']
    )
    expect(mockGuestCreate).toHaveBeenCalledTimes(2)
    expect(mockGuestCreate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        isTagAlong: true,
        isPrimaryContact: false,
      })
    )
  })

  it('updates household, guests, invitations, and gifts via repositories', async () => {
    await service.updateHouseholdWithGuests(actorContext, 'wedding-123', {
      householdId: 'household-123',
      guestParty: [
        {
          guestId: 1,
          firstName: 'John',
          lastName: 'Doe',
          isTagAlong: true,
          invites: { 'event-123': 'Attending' },
          tagIds: ['tag-1'],
        },
      ],
      deletedGuests: [9, 10],
      gifts: [{ eventId: 'event-123', description: 'Toaster', thankyou: true }],
    })

    expect(mockDb.$transaction).toHaveBeenCalledTimes(1)
    expect(mockUpdate).toHaveBeenCalledWith('household-123', expect.any(Object))
    expect(mockGuestDeleteMany).toHaveBeenCalledWith([9, 10])
    expect(mockClearPrimaryContactsByHousehold).toHaveBeenCalledWith('household-123')
    expect(mockGuestUpsert).toHaveBeenCalledTimes(1)
    expect(mockDeleteByGuestExcludingEvents).toHaveBeenCalledWith(1, ['event-123'])
    expect(mockGuestUpdateTags).toHaveBeenCalledWith(1, ['tag-1'])
    expect(mockInvitationUpdate).toHaveBeenCalledWith(1, 'event-123', { rsvp: 'Attending' })
    expect(mockGiftUpsert).toHaveBeenCalledWith({
      householdId: 'household-123',
      eventId: 'event-123',
      description: 'Toaster',
      thankyou: true,
    })
  })

  it('deletes household after scope check', async () => {
    const deletedId = await service.deleteHousehold(actorContext, 'household-123', 'wedding-123')

    expect(deletedId).toBe('household-123')
    expect(mockBelongsToWeddingFn).toHaveBeenCalledWith('household-123', 'wedding-123')
    expect(mockDelete).toHaveBeenCalledWith('household-123')
  })

  it('bulk create continues after non-authz errors and returns counts', async () => {
    mockCreateWithGifts
      .mockResolvedValueOnce({ ...mockHousehold, guests: [], gifts: [] })
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ ...mockHousehold, guests: [], gifts: [] })

    const result = await service.bulkCreateHouseholds(actorContext, 'wedding-123', [
      { guestParty: [{ firstName: 'A', lastName: 'A', invites: {} }] },
      { guestParty: [{ firstName: 'B', lastName: 'B', invites: {} }] },
      { guestParty: [{ firstName: 'C', lastName: 'C', invites: {} }] },
    ])

    expect(result).toEqual({ created: 2, failed: 1 })
  })

  it('bulk create rethrows authz errors', async () => {
    mockRequirePermission.mockReturnValue({ organizationId: 'org-1', role: 'admin' })
    mockCreateWithGifts.mockRejectedValue(new TRPCError({ code: 'FORBIDDEN' }))

    await expect(
      service.bulkCreateHouseholds(actorContext, 'wedding-123', [
        { guestParty: [{ firstName: 'A', lastName: 'A', invites: {} }] },
      ])
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('removes all invitations when tag-along has no allowed events', async () => {
    await service.updateHouseholdWithGuests(actorContext, 'wedding-123', {
      householdId: 'household-123',
      guestParty: [
        {
          guestId: 1,
          firstName: 'John',
          lastName: 'Doe',
          isTagAlong: true,
          invites: {},
        },
      ],
      gifts: [],
    })

    expect(mockDeleteByGuest).toHaveBeenCalledWith(1)
  })
})
