/**
 * Tests for Invitation Domain Service
 */

// Must mock before importing the service
jest.mock('~/server/domains/invitation/invitation.repository')

// @ts-expect-error - Importing mock functions from mocked module
import {
  InvitationRepository,
  mockCreate,
  mockCreateMany,
  mockFindByEventId,
  mockFindByGuestId,
  mockFindByUserId,
  mockGetRsvpCountsByEventId,
  mockInvitation,
  mockRsvpStats,
  mockUpdate,
  resetMocks,
} from '~/server/domains/invitation/invitation.repository'
import { InvitationService } from '~/server/domains/invitation/invitation.service'

// Create typed aliases for mocked functions
const mockCreateFn = mockCreate as jest.Mock
const mockCreateManyFn = mockCreateMany as jest.Mock
const mockUpdateFn = mockUpdate as jest.Mock
const mockFindByUserIdFn = mockFindByUserId as jest.Mock
const mockFindByEventIdFn = mockFindByEventId as jest.Mock
const mockFindByGuestIdFn = mockFindByGuestId as jest.Mock
const mockGetRsvpCountsByEventIdFn = mockGetRsvpCountsByEventId as jest.Mock

describe('InvitationService', () => {
  let invitationService: InvitationService

  beforeEach(() => {
    resetMocks()
    const mockRepository = new InvitationRepository({})
    invitationService = new InvitationService(mockRepository)
  })

  describe('createInvitation', () => {
    it('should create an invitation successfully', async () => {
      mockCreateFn.mockResolvedValue(mockInvitation)

      const result = await invitationService.createInvitation('user-123', {
        guestId: 1,
        eventId: 'event-123',
        rsvp: 'Invited',
      })

      expect(result).toEqual(mockInvitation)
      expect(mockCreateFn).toHaveBeenCalledWith({
        guestId: 1,
        eventId: 'event-123',
        rsvp: 'Invited',
        userId: 'user-123',
      })
    })
  })

  describe('updateInvitation', () => {
    it('should update an invitation RSVP', async () => {
      const updatedInvitation = { ...mockInvitation, rsvp: 'Attending' }
      mockUpdateFn.mockResolvedValue(updatedInvitation)

      const result = await invitationService.updateInvitation({
        guestId: 1,
        eventId: 'event-123',
        rsvp: 'Attending',
      })

      expect(result.rsvp).toBe('Attending')
      expect(mockUpdateFn).toHaveBeenCalledWith(1, 'event-123', { rsvp: 'Attending' })
    })
  })

  describe('getAllByUserId', () => {
    it('should return invitations for valid userId', async () => {
      mockFindByUserIdFn.mockResolvedValue([mockInvitation])

      const result = await invitationService.getAllByUserId('user-123')

      expect(result).toEqual([mockInvitation])
      expect(mockFindByUserIdFn).toHaveBeenCalledWith('user-123')
    })

    it('should return undefined when userId is null', async () => {
      const result = await invitationService.getAllByUserId(null)

      expect(result).toBeUndefined()
      expect(mockFindByUserIdFn).not.toHaveBeenCalled()
    })
  })

  describe('getByEventId', () => {
    it('should return all invitations for an event', async () => {
      const invitations = [mockInvitation, { ...mockInvitation, guestId: 2 }]
      mockFindByEventIdFn.mockResolvedValue(invitations)

      const result = await invitationService.getByEventId('event-123')

      expect(result).toEqual(invitations)
      expect(mockFindByEventIdFn).toHaveBeenCalledWith('event-123')
    })
  })

  describe('getByGuestId', () => {
    it('should return all invitations for a guest', async () => {
      const invitations = [mockInvitation, { ...mockInvitation, eventId: 'event-456' }]
      mockFindByGuestIdFn.mockResolvedValue(invitations)

      const result = await invitationService.getByGuestId(1)

      expect(result).toEqual(invitations)
      expect(mockFindByGuestIdFn).toHaveBeenCalledWith(1)
    })
  })

  describe('getStatsForEvent', () => {
    it('should return RSVP statistics for an event', async () => {
      mockGetRsvpCountsByEventIdFn.mockResolvedValue(mockRsvpStats)

      const result = await invitationService.getStatsForEvent('event-123')

      expect(result).toEqual(mockRsvpStats)
      expect(mockGetRsvpCountsByEventIdFn).toHaveBeenCalledWith('event-123')
    })
  })

  describe('createForGuestAndEvents', () => {
    it('should create invitations for a guest across multiple events', async () => {
      mockCreateManyFn.mockResolvedValue({ count: 3 })

      const result = await invitationService.createForGuestAndEvents(1, ['event-1', 'event-2', 'event-3'], 'user-123')

      expect(result).toEqual({ count: 3 })
      expect(mockCreateManyFn).toHaveBeenCalledWith([
        { guestId: 1, eventId: 'event-1', rsvp: 'Not Invited', userId: 'user-123' },
        { guestId: 1, eventId: 'event-2', rsvp: 'Not Invited', userId: 'user-123' },
        { guestId: 1, eventId: 'event-3', rsvp: 'Not Invited', userId: 'user-123' },
      ])
    })

    it('should use custom default RSVP status', async () => {
      mockCreateManyFn.mockResolvedValue({ count: 2 })

      await invitationService.createForGuestAndEvents(1, ['event-1', 'event-2'], 'user-123', 'Invited')

      expect(mockCreateManyFn).toHaveBeenCalledWith([
        { guestId: 1, eventId: 'event-1', rsvp: 'Invited', userId: 'user-123' },
        { guestId: 1, eventId: 'event-2', rsvp: 'Invited', userId: 'user-123' },
      ])
    })
  })

  describe('createForGuestsAndEvents', () => {
    it('should create invitations for multiple guests across multiple events', async () => {
      mockCreateManyFn.mockResolvedValue({ count: 6 })

      const result = await invitationService.createForGuestsAndEvents(
        [{ id: 1 }, { id: 2 }],
        [{ id: 'event-1' }, { id: 'event-2' }, { id: 'event-3' }],
        'user-123'
      )

      expect(result).toEqual({ count: 6 })
      expect(mockCreateManyFn).toHaveBeenCalledWith([
        { guestId: 1, eventId: 'event-1', rsvp: 'Not Invited', userId: 'user-123' },
        { guestId: 1, eventId: 'event-2', rsvp: 'Not Invited', userId: 'user-123' },
        { guestId: 1, eventId: 'event-3', rsvp: 'Not Invited', userId: 'user-123' },
        { guestId: 2, eventId: 'event-1', rsvp: 'Not Invited', userId: 'user-123' },
        { guestId: 2, eventId: 'event-2', rsvp: 'Not Invited', userId: 'user-123' },
        { guestId: 2, eventId: 'event-3', rsvp: 'Not Invited', userId: 'user-123' },
      ])
    })
  })
})
