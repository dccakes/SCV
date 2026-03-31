/**
 * Tests for Invitation Domain Service
 */

import { TRPCError } from '@trpc/server'

// Must mock before importing the service
jest.mock('server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))
jest.mock('server/domains/invitation/invitation.repository')

import { requirePermission } from 'server/authz/permission-checker'
// @ts-expect-error - Importing mock functions from mocked module
import {
  InvitationRepository,
  mockBelongsToUser,
  mockCreate,
  mockCreateMany,
  mockEventBelongsToWedding,
  mockFindByEventId,
  mockFindByGuestId,
  mockFindByWeddingId,
  mockGetRsvpCountsByEventId,
  mockGuestBelongsToWedding,
  mockInvitation,
  mockRsvpStats,
  mockUpdate,
  resetMocks,
} from 'server/domains/invitation/invitation.repository'
import { InvitationService } from 'server/domains/invitation/invitation.service'

// Create typed aliases for mocked functions
const mockCreateFn = mockCreate as jest.Mock
const mockCreateManyFn = mockCreateMany as jest.Mock
const mockUpdateFn = mockUpdate as jest.Mock
const mockFindByWeddingIdFn = mockFindByWeddingId as jest.Mock
const mockFindByEventIdFn = mockFindByEventId as jest.Mock
const mockFindByGuestIdFn = mockFindByGuestId as jest.Mock
const mockGetRsvpCountsByEventIdFn = mockGetRsvpCountsByEventId as jest.Mock
const mockBelongsToUserFn = mockBelongsToUser as jest.Mock
const mockGuestBelongsToWeddingFn = mockGuestBelongsToWedding as jest.Mock
const mockEventBelongsToWeddingFn = mockEventBelongsToWedding as jest.Mock
const mockRequirePermission = requirePermission as jest.Mock

const actorContext = {
  userId: 'user-123',
  activeOrganization: {
    organizationId: 'org-123',
    role: 'owner',
  },
}

describe('InvitationService', () => {
  let invitationService: InvitationService

  beforeEach(() => {
    resetMocks()
    mockRequirePermission.mockReset()
    mockRequirePermission.mockReturnValue({ organizationId: 'org-123', role: 'owner' })
    mockBelongsToUserFn.mockResolvedValue(true)
    mockGuestBelongsToWeddingFn.mockResolvedValue(true)
    mockEventBelongsToWeddingFn.mockResolvedValue(true)
    const mockRepository = new InvitationRepository({})
    invitationService = new InvitationService(mockRepository)
  })

  describe('createInvitation', () => {
    it('should create an invitation successfully', async () => {
      mockCreateFn.mockResolvedValue(mockInvitation)

      const result = await invitationService.createInvitation(actorContext, 'wedding-123', {
        guestId: 1,
        eventId: 'event-123',
        rsvp: 'Invited',
      })

      expect(result).toEqual(mockInvitation)
      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, {
        invitation: ['create'],
      })
      expect(mockCreateFn).toHaveBeenCalledWith({
        guestId: 1,
        eventId: 'event-123',
        rsvp: 'Invited',
        weddingId: 'wedding-123',
      })
    })

    it('should reject create when actor lacks invitation create permission', async () => {
      mockRequirePermission.mockImplementation(() => {
        throw new TRPCError({ code: 'FORBIDDEN' })
      })

      await expect(
        invitationService.createInvitation(actorContext, 'wedding-123', {
          guestId: 1,
          eventId: 'event-123',
          rsvp: 'Invited',
        })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })

      expect(mockCreateFn).not.toHaveBeenCalled()
    })

    it('should reject create when guest does not belong to wedding', async () => {
      mockGuestBelongsToWeddingFn.mockResolvedValue(false)

      await expect(
        invitationService.createInvitation(actorContext, 'wedding-123', {
          guestId: 1,
          eventId: 'event-123',
          rsvp: 'Invited',
        })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })

      expect(mockCreateFn).not.toHaveBeenCalled()
    })

    it('should reject create when event does not belong to wedding', async () => {
      mockEventBelongsToWeddingFn.mockResolvedValue(false)

      await expect(
        invitationService.createInvitation(actorContext, 'wedding-123', {
          guestId: 1,
          eventId: 'event-123',
          rsvp: 'Invited',
        })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })

      expect(mockCreateFn).not.toHaveBeenCalled()
    })
  })

  describe('updateInvitation', () => {
    it('should update an invitation RSVP', async () => {
      const updatedInvitation = { ...mockInvitation, rsvp: 'Attending' }
      mockUpdateFn.mockResolvedValue(updatedInvitation)

      const result = await invitationService.updateInvitation(actorContext, {
        guestId: 1,
        eventId: 'event-123',
        rsvp: 'Attending',
      })

      expect(result.rsvp).toBe('Attending')
      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, {
        rsvp: ['edit_response'],
      })
      expect(mockUpdateFn).toHaveBeenCalledWith(1, 'event-123', { rsvp: 'Attending' })
    })

    it('should reject update when actor lacks RSVP edit permission', async () => {
      mockRequirePermission.mockImplementation(() => {
        throw new TRPCError({ code: 'FORBIDDEN' })
      })

      await expect(
        invitationService.updateInvitation(actorContext, {
          guestId: 1,
          eventId: 'event-123',
          rsvp: 'Attending',
        })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })

      expect(mockUpdateFn).not.toHaveBeenCalled()
    })
  })

  describe('getAllByWeddingId', () => {
    it('should return invitations for valid weddingId', async () => {
      mockFindByWeddingIdFn.mockResolvedValue([mockInvitation])

      const result = await invitationService.getAllByWeddingId('wedding-123')

      expect(result).toEqual([mockInvitation])
      expect(mockFindByWeddingIdFn).toHaveBeenCalledWith('wedding-123')
    })

    it('should return undefined when weddingId is null', async () => {
      const result = await invitationService.getAllByWeddingId(null)

      expect(result).toBeUndefined()
      expect(mockFindByWeddingIdFn).not.toHaveBeenCalled()
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

      const result = await invitationService.createForGuestAndEvents(
        1,
        ['event-1', 'event-2', 'event-3'],
        'wedding-123'
      )

      expect(result).toEqual({ count: 3 })
      expect(mockCreateManyFn).toHaveBeenCalledWith([
        { guestId: 1, eventId: 'event-1', rsvp: 'Not Invited', weddingId: 'wedding-123' },
        { guestId: 1, eventId: 'event-2', rsvp: 'Not Invited', weddingId: 'wedding-123' },
        { guestId: 1, eventId: 'event-3', rsvp: 'Not Invited', weddingId: 'wedding-123' },
      ])
    })

    it('should use custom default RSVP status', async () => {
      mockCreateManyFn.mockResolvedValue({ count: 2 })

      await invitationService.createForGuestAndEvents(
        1,
        ['event-1', 'event-2'],
        'wedding-123',
        'Invited'
      )

      expect(mockCreateManyFn).toHaveBeenCalledWith([
        { guestId: 1, eventId: 'event-1', rsvp: 'Invited', weddingId: 'wedding-123' },
        { guestId: 1, eventId: 'event-2', rsvp: 'Invited', weddingId: 'wedding-123' },
      ])
    })
  })

  describe('createForGuestsAndEvents', () => {
    it('should create invitations for multiple guests across multiple events', async () => {
      mockCreateManyFn.mockResolvedValue({ count: 6 })

      const result = await invitationService.createForGuestsAndEvents(
        [{ id: 1 }, { id: 2 }],
        [{ id: 'event-1' }, { id: 'event-2' }, { id: 'event-3' }],
        'wedding-123'
      )

      expect(result).toEqual({ count: 6 })
      expect(mockCreateManyFn).toHaveBeenCalledWith([
        { guestId: 1, eventId: 'event-1', rsvp: 'Not Invited', weddingId: 'wedding-123' },
        { guestId: 1, eventId: 'event-2', rsvp: 'Not Invited', weddingId: 'wedding-123' },
        { guestId: 1, eventId: 'event-3', rsvp: 'Not Invited', weddingId: 'wedding-123' },
        { guestId: 2, eventId: 'event-1', rsvp: 'Not Invited', weddingId: 'wedding-123' },
        { guestId: 2, eventId: 'event-2', rsvp: 'Not Invited', weddingId: 'wedding-123' },
        { guestId: 2, eventId: 'event-3', rsvp: 'Not Invited', weddingId: 'wedding-123' },
      ])
    })
  })
})
