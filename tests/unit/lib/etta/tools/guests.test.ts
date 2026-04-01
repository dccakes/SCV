/**
 * @jest-environment node
 */

import { getGuestTools } from '~/lib/etta/tools/guests'
import type { EttaContext } from '~/lib/etta/types'
import { guestService } from '~/server/domains/guest'
import { invitationService } from '~/server/domains/invitation'

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
})
