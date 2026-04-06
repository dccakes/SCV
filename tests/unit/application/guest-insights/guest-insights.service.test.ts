import { TRPCError } from '@trpc/server'
import { RSVP_STATUS } from '~/lib/constants/rsvp'
import { GuestInsightsService } from '~/server/application/guest-insights/guest-insights.service'
import type { AuthzContext } from '~/server/authz/authorization.types'

jest.mock('~/lib/auth-permissions', () => require('~/lib/__mocks__/auth-permissions'))

describe('GuestInsightsService', () => {
  const buildAuthz = (role: 'owner' | 'admin' | 'member' | 'viewer'): AuthzContext => ({
    userId: 'user-1',
    activeOrganization: { organizationId: 'org-1', role },
  })

  const guestService = {
    getAllByWeddingId: jest.fn(),
    getAllByHouseholdId: jest.fn(),
  }
  const invitationService = {
    getAllByWeddingId: jest.fn(),
    getByEventIdInWedding: jest.fn(),
  }
  const eventService = {
    getWeddingEvents: jest.fn(),
  }

  const service = new GuestInsightsService(guestService, invitationService, eventService)

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('lists guests for a wedding when caller has guest.read', async () => {
    guestService.getAllByWeddingId.mockResolvedValue([{ id: 1 }])

    const result = await service.listGuests(buildAuthz('member'), 'wedding-1')

    expect(result).toEqual([{ id: 1 }])
    expect(guestService.getAllByWeddingId).toHaveBeenCalledWith('wedding-1')
  })

  it('rejects guest list reads for viewer role', async () => {
    await expect(service.listGuests(buildAuthz('viewer'), 'wedding-1')).rejects.toThrow(TRPCError)
  })

  it('rejects household reads when household guests are outside wedding scope', async () => {
    guestService.getAllByHouseholdId.mockResolvedValue([{ id: 1, weddingId: 'other-wedding' }])

    await expect(
      service.listHouseholdGuests(buildAuthz('owner'), 'wedding-1', 'household-1')
    ).rejects.toThrow(TRPCError)
  })

  it('returns RSVP summary counts', async () => {
    invitationService.getAllByWeddingId.mockResolvedValue([
      { rsvp: RSVP_STATUS.ATTENDING },
      { rsvp: RSVP_STATUS.DECLINED },
      { rsvp: RSVP_STATUS.INVITED },
    ])

    const result = await service.getRsvpSummary(buildAuthz('owner'), 'wedding-1')
    expect(result).toEqual({ total: 3, attending: 1, declined: 1, pending: 1 })
  })

  it('returns event attendance for a matched guest', async () => {
    guestService.getAllByWeddingId.mockResolvedValue([
      {
        id: 7,
        firstName: 'Gingy',
        lastName: 'Cookie',
        email: 'gingy@example.com',
        householdId: 'household-1',
      },
    ])
    invitationService.getAllByWeddingId.mockResolvedValue([
      { guestId: 7, eventId: 'evt-1', rsvp: RSVP_STATUS.ATTENDING },
    ])
    eventService.getWeddingEvents.mockResolvedValue([{ id: 'evt-1', name: 'Ceremony' }])

    const result = await service.getGuestEventAttendance(buildAuthz('owner'), 'wedding-1', 'Gingy')

    expect(result).toEqual({
      guest: {
        id: 7,
        name: 'Gingy Cookie',
        email: 'gingy@example.com',
        householdId: 'household-1',
      },
      attendance: [{ eventId: 'evt-1', eventName: 'Ceremony', rsvp: RSVP_STATUS.ATTENDING }],
    })
  })
})
