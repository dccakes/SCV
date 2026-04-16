/**
 * @jest-environment node
 */

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(() => ({ organizationId: 'org-1', role: 'owner' })),
}))

import { getGuestTools } from '~/lib/etta/tools/guests'
import type { EttaContext } from '~/lib/etta/types'
import { guestInsightsService } from '~/server/application/guest-insights'
import { guestService } from '~/server/domains/guest'

jest.mock('~/server/application/guest-insights', () => ({
  guestInsightsService: {
    listGuests: jest.fn(),
    getRsvpSummary: jest.fn(),
    getGuestEventAttendance: jest.fn(),
    listEventAttendance: jest.fn(),
  },
}))

jest.mock('~/server/domains/guest', () => ({
  guestService: {
    updateGuest: jest.fn(),
    getById: jest.fn(),
    updateGuestTags: jest.fn(),
  },
}))

jest.mock('~/server/application/household-management', () => ({
  householdManagementService: {
    updateHouseholdAddress: jest.fn(),
  },
}))

import { householdManagementService } from '~/server/application/household-management'

const mockGuestService = guestService as {
  updateGuest: jest.Mock
  getById: jest.Mock
  updateGuestTags: jest.Mock
}

const mockHouseholdManagementService = householdManagementService as {
  updateHouseholdAddress: jest.Mock
}

const mockGuestInsightsService = guestInsightsService as {
  listGuests: jest.Mock
  getRsvpSummary: jest.Mock
  getGuestEventAttendance: jest.Mock
  listEventAttendance: jest.Mock
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
      mockGuestInsightsService.listGuests.mockResolvedValue(guests)

      const result = await tools.get_guest_list.execute(
        {},
        { toolCallId: 'tc1', messages: [], abortSignal: undefined as never }
      )

      expect(mockGuestInsightsService.listGuests).toHaveBeenCalledWith(mockCtx.authz, 'wedding-123')
      expect(result).toEqual({ guests })
    })

    it('returns empty array when no guests', async () => {
      mockGuestInsightsService.listGuests.mockResolvedValue([])

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

      expect(mockGuestService.updateGuest).toHaveBeenCalledWith(mockCtx.authz, 'wedding-123', 1, {
        lastName: 'Updated',
        email: 'new@test.com',
      })
      expect(result).toEqual({ guest: updated })
    })

    it('skips updateGuest when only address fields provided', async () => {
      const guest = { id: 1, firstName: 'Alice', householdId: 'household-456' }
      mockGuestService.getById.mockResolvedValue(guest)
      const updatedHousehold = {
        id: 'household-456',
        address1: '789 Elm St',
        city: 'Portland',
        state: 'OR',
      }
      mockHouseholdManagementService.updateHouseholdAddress.mockResolvedValue(updatedHousehold)

      const params = { guestId: 1, address1: '789 Elm St', city: 'Portland', state: 'OR' }
      const result = await tools.update_guest.execute(params, {
        toolCallId: 'tc-addr',
        messages: [],
        abortSignal: undefined as never,
      })

      expect(mockGuestService.updateGuest).not.toHaveBeenCalled()
      expect(mockGuestService.getById).toHaveBeenCalledWith(1)
      expect(mockHouseholdManagementService.updateHouseholdAddress).toHaveBeenCalledWith(
        mockCtx.authz,
        'wedding-123',
        'household-456',
        { address1: '789 Elm St', city: 'Portland', state: 'OR' }
      )
      expect(result).toEqual({ guest, household: updatedHousehold })
    })

    it('skips updateGuest when only tags provided', async () => {
      const guest = { id: 1, firstName: 'Alice', householdId: 'household-456' }
      mockGuestService.getById.mockResolvedValue(guest)
      mockGuestService.updateGuestTags.mockResolvedValue(undefined)

      const params = { guestId: 1, tagIds: ['tag-1', 'tag-2'] }
      const result = await tools.update_guest.execute(params, {
        toolCallId: 'tc-tags',
        messages: [],
        abortSignal: undefined as never,
      })

      expect(mockGuestService.updateGuest).not.toHaveBeenCalled()
      expect(mockGuestService.updateGuestTags).toHaveBeenCalledWith(
        mockCtx.authz,
        'wedding-123',
        1,
        ['tag-1', 'tag-2']
      )
      expect(result).toEqual({ guest })
    })

    it('uses updateGuest result for householdId when guest fields provided', async () => {
      const updated = {
        id: 1,
        firstName: 'Alice',
        lastName: 'Updated',
        householdId: 'household-456',
      }
      mockGuestService.updateGuest.mockResolvedValue(updated)
      const updatedHousehold = { id: 'household-456', address1: '123 Main St' }
      mockHouseholdManagementService.updateHouseholdAddress.mockResolvedValue(updatedHousehold)
      mockGuestService.updateGuestTags.mockResolvedValue(undefined)

      const params = {
        guestId: 1,
        lastName: 'Updated',
        address1: '123 Main St',
        tagIds: ['tag-3'],
      }
      const result = await tools.update_guest.execute(params, {
        toolCallId: 'tc-all',
        messages: [],
        abortSignal: undefined as never,
      })

      expect(mockGuestService.updateGuest).toHaveBeenCalledWith(mockCtx.authz, 'wedding-123', 1, {
        lastName: 'Updated',
      })
      expect(mockGuestService.getById).not.toHaveBeenCalled()
      expect(mockHouseholdManagementService.updateHouseholdAddress).toHaveBeenCalledWith(
        mockCtx.authz,
        'wedding-123',
        'household-456',
        { address1: '123 Main St' }
      )
      expect(mockGuestService.updateGuestTags).toHaveBeenCalledWith(
        mockCtx.authz,
        'wedding-123',
        1,
        ['tag-3']
      )
      expect(result).toEqual({
        guest: updated,
        household: updatedHousehold,
      })
    })

    it('returns error when guest not found', async () => {
      mockGuestService.getById.mockResolvedValue(null)

      const params = { guestId: 99, address1: '123 Main St' }
      const result = await tools.update_guest.execute(params, {
        toolCallId: 'tc-notfound',
        messages: [],
        abortSignal: undefined as never,
      })

      expect(result).toEqual({ error: 'Guest not found' })
      expect(mockHouseholdManagementService.updateHouseholdAddress).not.toHaveBeenCalled()
    })
  })

  describe('get_rsvp_summary', () => {
    it('returns all zeros for empty invitation list', async () => {
      mockGuestInsightsService.getRsvpSummary.mockResolvedValue({
        total: 0,
        attending: 0,
        declined: 0,
        pending: 0,
      })

      const result = await tools.get_rsvp_summary.execute(
        {},
        { toolCallId: 'tc5', messages: [], abortSignal: undefined as never }
      )

      expect(mockGuestInsightsService.getRsvpSummary).toHaveBeenCalledWith(
        mockCtx.authz,
        'wedding-123'
      )
      expect(result).toEqual({
        total: 0,
        attending: 0,
        declined: 0,
        pending: 0,
      })
    })

    it('computes correct counts from invitations', async () => {
      mockGuestInsightsService.getRsvpSummary.mockResolvedValue({
        total: 6,
        attending: 2,
        declined: 1,
        pending: 3,
      })

      const result = await tools.get_rsvp_summary.execute(
        {},
        { toolCallId: 'tc4', messages: [], abortSignal: undefined as never }
      )

      expect(mockGuestInsightsService.getRsvpSummary).toHaveBeenCalledWith(
        mockCtx.authz,
        'wedding-123'
      )
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
      mockGuestInsightsService.getGuestEventAttendance.mockResolvedValue({
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
      expect(mockGuestInsightsService.getGuestEventAttendance).toHaveBeenCalledWith(
        mockCtx.authz,
        'wedding-123',
        'Gingy'
      )
    })

    it('returns a not found payload when no guest matches the query', async () => {
      mockGuestInsightsService.getGuestEventAttendance.mockResolvedValue({
        guest: null,
        attendance: [],
        message: 'No guest found matching "Donkey".',
      })

      const result = await tools.get_guest_event_attendance.execute(
        { guestQuery: 'Donkey' },
        { toolCallId: 'tc7', messages: [], abortSignal: undefined as never }
      )

      expect(result).toEqual({
        guest: null,
        attendance: [],
        message: 'No guest found matching "Donkey".',
      })
      expect(mockGuestInsightsService.getGuestEventAttendance).toHaveBeenCalledWith(
        mockCtx.authz,
        'wedding-123',
        'Donkey'
      )
    })
  })

  describe('list_event_attendance', () => {
    it('returns attendees for a matching event filtered by RSVP status', async () => {
      mockGuestInsightsService.listEventAttendance.mockResolvedValue({
        event: { id: 'evt-1', name: 'Ceremony' },
        guests: [
          { guestId: 9, name: 'Fiona Ogre', email: 'fiona@swamp.wed', rsvp: 'Attending' },
          { guestId: 7, name: 'Gingy Cookie', email: 'gingy@swamp.wed', rsvp: 'Attending' },
        ],
      })

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
      expect(mockGuestInsightsService.listEventAttendance).toHaveBeenCalledWith(
        mockCtx.authz,
        'wedding-123',
        'ceremony',
        'Attending'
      )
    })

    it('returns all RSVP buckets when no filter is provided', async () => {
      mockGuestInsightsService.listEventAttendance.mockResolvedValue({
        event: { id: 'evt-2', name: 'Breakfast' },
        guests: [
          { guestId: 8, name: 'Shrek Ogre', email: 'shrek@swamp.wed', rsvp: 'Declined' },
          { guestId: 7, name: 'Gingy Cookie', email: 'gingy@swamp.wed', rsvp: 'Invited' },
        ],
      })

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
      expect(mockGuestInsightsService.listEventAttendance).toHaveBeenCalledWith(
        mockCtx.authz,
        'wedding-123',
        'Breakfast',
        undefined
      )
    })
  })
})
