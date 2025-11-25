/**
 * Tests for Guest Domain Service
 */

// Must mock before importing the service
jest.mock('~/server/domains/guest/guest.repository')

// @ts-expect-error - Importing mock functions from mocked module
import {
  GuestRepository,
  mockCreate,
  mockCreateWithInvitations,
  mockDelete,
  mockDeleteMany,
  mockFindByHouseholdIdWithInvitations,
  mockFindById,
  mockFindByIdWithInvitations,
  mockFindByUserId,
  mockGuest,
  mockGuestWithInvitations,
  mockUpdate,
  mockUpsert,
  resetMocks,
} from '~/server/domains/guest/guest.repository'
import { GuestService } from '~/server/domains/guest/guest.service'

// Create typed aliases for mocked functions
const mockFindByUserIdFn = mockFindByUserId as jest.Mock
const mockFindByHouseholdIdWithInvitationsFn = mockFindByHouseholdIdWithInvitations as jest.Mock
const mockFindByIdFn = mockFindById as jest.Mock
const mockFindByIdWithInvitationsFn = mockFindByIdWithInvitations as jest.Mock
const mockCreateFn = mockCreate as jest.Mock
const mockCreateWithInvitationsFn = mockCreateWithInvitations as jest.Mock
const mockUpsertFn = mockUpsert as jest.Mock
const mockUpdateFn = mockUpdate as jest.Mock
const mockDeleteFn = mockDelete as jest.Mock
const mockDeleteManyFn = mockDeleteMany as jest.Mock

describe('GuestService', () => {
  let guestService: GuestService

  beforeEach(() => {
    resetMocks()
    const mockRepository = new GuestRepository({})
    guestService = new GuestService(mockRepository)
  })

  describe('getAllByUserId', () => {
    it('should return guests for valid userId', async () => {
      mockFindByUserIdFn.mockResolvedValue([mockGuest])

      const result = await guestService.getAllByUserId('user-123')

      expect(result).toEqual([mockGuest])
      expect(mockFindByUserIdFn).toHaveBeenCalledWith('user-123')
    })

    it('should return undefined when userId is null', async () => {
      const result = await guestService.getAllByUserId(null)

      expect(result).toBeUndefined()
      expect(mockFindByUserIdFn).not.toHaveBeenCalled()
    })
  })

  describe('getAllByHouseholdId', () => {
    it('should return guests with invitations for household', async () => {
      mockFindByHouseholdIdWithInvitationsFn.mockResolvedValue([mockGuestWithInvitations])

      const result = await guestService.getAllByHouseholdId('household-123')

      expect(result).toEqual([mockGuestWithInvitations])
      expect(mockFindByHouseholdIdWithInvitationsFn).toHaveBeenCalledWith('household-123')
    })
  })

  describe('getById', () => {
    it('should return a guest when found', async () => {
      mockFindByIdFn.mockResolvedValue(mockGuest)

      const result = await guestService.getById(1)

      expect(result).toEqual(mockGuest)
      expect(mockFindByIdFn).toHaveBeenCalledWith(1)
    })

    it('should return null when guest not found', async () => {
      mockFindByIdFn.mockResolvedValue(null)

      const result = await guestService.getById(999)

      expect(result).toBeNull()
    })
  })

  describe('getByIdWithInvitations', () => {
    it('should return guest with invitations', async () => {
      mockFindByIdWithInvitationsFn.mockResolvedValue(mockGuestWithInvitations)

      const result = await guestService.getByIdWithInvitations(1)

      expect(result).toEqual(mockGuestWithInvitations)
      expect(mockFindByIdWithInvitationsFn).toHaveBeenCalledWith(1)
    })
  })

  describe('createGuest', () => {
    it('should create a guest successfully', async () => {
      mockCreateFn.mockResolvedValue(mockGuest)

      const result = await guestService.createGuest('user-123', {
        firstName: 'John',
        lastName: 'Doe',
        householdId: 'household-123',
        isPrimaryContact: true,
      })

      expect(result).toEqual(mockGuest)
      expect(mockCreateFn).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        householdId: 'household-123',
        userId: 'user-123',
        isPrimaryContact: true,
      })
    })
  })

  describe('createGuestWithInvitations', () => {
    it('should create a guest with invitations', async () => {
      mockCreateWithInvitationsFn.mockResolvedValue(mockGuest)

      const result = await guestService.createGuestWithInvitations('user-123', {
        firstName: 'John',
        lastName: 'Doe',
        householdId: 'household-123',
        isPrimaryContact: true,
        invitations: [
          { eventId: 'event-123', rsvp: 'Attending' },
          { eventId: 'event-456', rsvp: 'Invited' },
        ],
      })

      expect(result).toEqual(mockGuest)
      expect(mockCreateWithInvitationsFn).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        householdId: 'household-123',
        userId: 'user-123',
        isPrimaryContact: true,
        invitations: [
          { eventId: 'event-123', rsvp: 'Attending', userId: 'user-123' },
          { eventId: 'event-456', rsvp: 'Invited', userId: 'user-123' },
        ],
      })
    })
  })

  describe('upsertGuest', () => {
    it('should upsert an existing guest', async () => {
      mockUpsertFn.mockResolvedValue(mockGuest)

      const result = await guestService.upsertGuest('user-123', {
        guestId: 1,
        firstName: 'John',
        lastName: 'Doe',
        householdId: 'household-123',
      })

      expect(result).toEqual(mockGuest)
    })

    it('should create a new guest when guestId is undefined', async () => {
      mockUpsertFn.mockResolvedValue(mockGuest)

      await guestService.upsertGuest('user-123', {
        firstName: 'New',
        lastName: 'Guest',
        householdId: 'household-123',
      })

      expect(mockUpsertFn).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          firstName: 'New',
          lastName: 'Guest',
        }),
        undefined
      )
    })
  })

  describe('updateGuest', () => {
    it('should update a guest', async () => {
      const updatedGuest = { ...mockGuest, firstName: 'Jane' }
      mockUpdateFn.mockResolvedValue(updatedGuest)

      const result = await guestService.updateGuest(1, { firstName: 'Jane' })

      expect(result.firstName).toBe('Jane')
      expect(mockUpdateFn).toHaveBeenCalledWith(1, { firstName: 'Jane' })
    })
  })

  describe('deleteGuest', () => {
    it('should delete a guest', async () => {
      mockDeleteFn.mockResolvedValue(mockGuest)

      const result = await guestService.deleteGuest(1)

      expect(result).toEqual(mockGuest)
      expect(mockDeleteFn).toHaveBeenCalledWith(1)
    })
  })

  describe('deleteGuests', () => {
    it('should delete multiple guests', async () => {
      mockDeleteManyFn.mockResolvedValue({ count: 3 })

      const result = await guestService.deleteGuests([1, 2, 3])

      expect(result).toEqual({ count: 3 })
      expect(mockDeleteManyFn).toHaveBeenCalledWith([1, 2, 3])
    })
  })
})
