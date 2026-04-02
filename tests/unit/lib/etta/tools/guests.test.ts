/**
 * @jest-environment node
 */

import { getGuestTools } from '~/lib/etta/tools/guests'
import type { EttaContext } from '~/lib/etta/types'
import { eventService } from '~/server/domains/event'
import { guestService } from '~/server/domains/guest'
import { invitationService } from '~/server/domains/invitation'

jest.mock('~/server/domains/event')
jest.mock('~/server/domains/guest', () => ({
  guestService: {
    getAllByWeddingId: jest.fn(),
    updateGuest: jest.fn(),
  },
}))

jest.mock('~/server/domains/invitation', () => ({
  invitationService: {
    getAllByWeddingId: jest.fn(),
  },
}))

const mockGuestService = guestService as {
  getAllByWeddingId: jest.Mock
  updateGuest: jest.Mock
}

const mockEventService = eventService as {
  getWeddingEvents: jest.Mock
}

const mockInvitationService = invitationService as {
  getAllByWeddingId: jest.Mock
}

const mockCtx: EttaContext = {
  weddingId: 'wedding-123',
  ettaActorId: 'actor-123',
  actor: 'couple',
  authz: { userId: 'user-1', activeOrganization: { organizationId: 'org-1', role: 'owner' } },
  wedding: {
    groomFirstName: 'John',
    groomLastName: 'Doe',
    brideFirstName: 'Jane',
    brideLastName: 'Smith',
  },
  guestCount: 50,
  eventCount: 2,
  vendorCount: 3,
  pendingSuggestionCount: 1,
  recentMemories: [],
}

describe('getGuestTools', () => {
  beforeEach(() => jest.clearAllMocks())

  const tools = getGuestTools(mockCtx)

  describe('get_guest_list', () => {
    it('returns guests from service', async () => {
      const guests = [
        { id: 1, firstName: 'Alice', lastName: 'Wonder', email: 'alice@test.com' },
        { id: 2, firstName: 'Bob', lastName: 'Builder', email: null },
      ]
      mockGuestService.getAllByWeddingId.mockResolvedValue(guests)

      const result = await tools.get_guest_list.execute(
        {},
        { toolCallId: 'tc1', messages: [], abortSignal: undefined as never }
      )

      expect(mockGuestService.getAllByWeddingId).toHaveBeenCalledWith('wedding-123')
      expect(result).toEqual({ guests })
    })

    it('returns empty array when no guests', async () => {
      mockGuestService.getAllByWeddingId.mockResolvedValue(undefined)

      const result = await tools.get_guest_list.execute(
        {},
        { toolCallId: 'tc2', messages: [], abortSignal: undefined as never }
      )

      expect(result).toEqual({ guests: [] })
    })
  })

  describe('update_guest', () => {
    it('calls service with correct params', async () => {
      const updated = { id: 1, firstName: 'Alice', lastName: 'Updated', email: 'new@test.com' }
      mockGuestService.updateGuest.mockResolvedValue(updated)

      const params = { guestId: 1, lastName: 'Updated', email: 'new@test.com' }
      const result = await tools.update_guest.execute(params, {
        toolCallId: 'tc3',
        messages: [],
        abortSignal: undefined as never,
      })

      expect(mockGuestService.updateGuest).toHaveBeenCalledWith(mockCtx.authz, 1, {
        lastName: 'Updated',
        email: 'new@test.com',
      })
      expect(result).toEqual({ guest: updated })
    })
  })

  describe('get_rsvp_summary', () => {
    it('returns all zeros for empty invitation list', async () => {
      mockInvitationService.getAllByWeddingId.mockResolvedValue([])

      const result = await tools.get_rsvp_summary.execute(
        {},
        { toolCallId: 'tc5', messages: [], abortSignal: undefined as never }
      )

      expect(mockInvitationService.getAllByWeddingId).toHaveBeenCalledWith('wedding-123')
      expect(result).toEqual({
        total: 0,
        attending: 0,
        declined: 0,
        pending: 0,
      })
    })

    it('computes correct counts from invitations', async () => {
      const invitations = [
        { id: '1', rsvp: 'Attending' },
        { id: '2', rsvp: 'Attending' },
        { id: '3', rsvp: 'Declined' },
        { id: '4', rsvp: 'Invited' },
        { id: '5', rsvp: 'Invited' },
        { id: '6', rsvp: 'Invited' },
      ]
      mockInvitationService.getAllByWeddingId.mockResolvedValue(invitations)

      const result = await tools.get_rsvp_summary.execute(
        {},
        { toolCallId: 'tc4', messages: [], abortSignal: undefined as never }
      )

      expect(mockInvitationService.getAllByWeddingId).toHaveBeenCalledWith('wedding-123')
      expect(result).toEqual({
        total: 6,
        attending: 2,
        declined: 1,
        pending: 3,
      })
    })
  })

  describe('get_guest_event_attendance', () => {
    it('returns matching guest attendance across events', async () => {
      mockGuestService.getAllByWeddingId.mockResolvedValue([
        {
          id: 7,
          firstName: 'Gingy',
          lastName: 'Cookie',
          email: 'gingy@swamp.wed',
          householdId: 'household-seed-gingy',
        },
      ])
      mockEventService.getWeddingEvents.mockResolvedValue([
        { id: 'evt-1', name: 'Ceremony' },
        { id: 'evt-2', name: 'Reception' },
        { id: 'evt-3', name: 'Breakfast' },
      ])
      mockInvitationService.getAllByWeddingId.mockResolvedValue([
        { guestId: 7, eventId: 'evt-1', rsvp: 'Attending' },
        { guestId: 7, eventId: 'evt-2', rsvp: 'Declined' },
        { guestId: 7, eventId: 'evt-3', rsvp: 'Invited' },
      ])

      const result = await tools.get_guest_event_attendance.execute(
        { guestQuery: 'Gingy' },
        { toolCallId: 'tc6', messages: [], abortSignal: undefined as never }
      )

      expect(result).toEqual({
        guest: {
          id: 7,
          name: 'Gingy Cookie',
          email: 'gingy@swamp.wed',
          householdId: 'household-seed-gingy',
        },
        attendance: [
          { eventId: 'evt-3', eventName: 'Breakfast', rsvp: 'Invited' },
          { eventId: 'evt-1', eventName: 'Ceremony', rsvp: 'Attending' },
          { eventId: 'evt-2', eventName: 'Reception', rsvp: 'Declined' },
        ],
      })
    })

    it('returns a not found payload when no guest matches the query', async () => {
      mockGuestService.getAllByWeddingId.mockResolvedValue([
        { id: 7, firstName: 'Gingy', lastName: 'Cookie', email: 'gingy@swamp.wed' },
      ])

      const result = await tools.get_guest_event_attendance.execute(
        { guestQuery: 'Donkey' },
        { toolCallId: 'tc7', messages: [], abortSignal: undefined as never }
      )

      expect(result).toEqual({
        guest: null,
        attendance: [],
        message: 'No guest found matching "Donkey".',
      })
    })
  })

  describe('list_event_attendance', () => {
    it('returns attendees for a matching event filtered by RSVP status', async () => {
      mockGuestService.getAllByWeddingId.mockResolvedValue([
        { id: 7, firstName: 'Gingy', lastName: 'Cookie', email: 'gingy@swamp.wed' },
        { id: 8, firstName: 'Shrek', lastName: 'Ogre', email: 'shrek@swamp.wed' },
        { id: 9, firstName: 'Fiona', lastName: 'Ogre', email: 'fiona@swamp.wed' },
      ])
      mockEventService.getWeddingEvents.mockResolvedValue([
        { id: 'evt-1', name: 'Ceremony' },
        { id: 'evt-2', name: 'Breakfast' },
      ])
      mockInvitationService.getAllByWeddingId.mockResolvedValue([
        { guestId: 7, eventId: 'evt-1', rsvp: 'Attending' },
        { guestId: 8, eventId: 'evt-1', rsvp: 'Declined' },
        { guestId: 9, eventId: 'evt-1', rsvp: 'Attending' },
      ])

      const result = await tools.list_event_attendance.execute(
        { eventQuery: 'ceremony', rsvpFilter: 'Attending' },
        { toolCallId: 'tc8', messages: [], abortSignal: undefined as never }
      )

      expect(result).toEqual({
        event: { id: 'evt-1', name: 'Ceremony' },
        guests: [
          { guestId: 9, name: 'Fiona Ogre', email: 'fiona@swamp.wed', rsvp: 'Attending' },
          { guestId: 7, name: 'Gingy Cookie', email: 'gingy@swamp.wed', rsvp: 'Attending' },
        ],
      })
    })

    it('returns all RSVP buckets when no filter is provided', async () => {
      mockGuestService.getAllByWeddingId.mockResolvedValue([
        { id: 7, firstName: 'Gingy', lastName: 'Cookie', email: 'gingy@swamp.wed' },
        { id: 8, firstName: 'Shrek', lastName: 'Ogre', email: 'shrek@swamp.wed' },
      ])
      mockEventService.getWeddingEvents.mockResolvedValue([{ id: 'evt-2', name: 'Breakfast' }])
      mockInvitationService.getAllByWeddingId.mockResolvedValue([
        { guestId: 7, eventId: 'evt-2', rsvp: 'Invited' },
        { guestId: 8, eventId: 'evt-2', rsvp: 'Declined' },
      ])

      const result = await tools.list_event_attendance.execute(
        { eventQuery: 'Breakfast' },
        { toolCallId: 'tc9', messages: [], abortSignal: undefined as never }
      )

      expect(result).toEqual({
        event: { id: 'evt-2', name: 'Breakfast' },
        guests: [
          { guestId: 8, name: 'Shrek Ogre', email: 'shrek@swamp.wed', rsvp: 'Declined' },
          { guestId: 7, name: 'Gingy Cookie', email: 'gingy@swamp.wed', rsvp: 'Invited' },
        ],
      })
    })
  })
})
