import { TRPCError } from '@trpc/server'
import { EventInsightsService } from '~/server/application/event-insights/event-insights.service'
import type { AuthzContext } from '~/server/authz/authorization.types'

jest.mock('~/lib/auth-permissions', () => require('~/lib/__mocks__/auth-permissions'))

describe('EventInsightsService', () => {
  const buildAuthz = (role: 'owner' | 'admin' | 'member' | 'viewer'): AuthzContext => ({
    userId: 'user-1',
    activeOrganization: { organizationId: 'org-1', role },
  })

  const eventService = {
    getWeddingEvents: jest.fn(),
    getWeddingEventsWithStats: jest.fn(),
  }
  const invitationService = {
    getAllByWeddingId: jest.fn(),
  }

  const service = new EventInsightsService(eventService, invitationService)

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('lists events for member role', async () => {
    eventService.getWeddingEvents.mockResolvedValue([{ id: 'event-1' }])
    const result = await service.listEvents(buildAuthz('member'), 'wedding-1')
    expect(result).toEqual([{ id: 'event-1' }])
  })

  it('rejects event list for viewer role', async () => {
    await expect(service.listEvents(buildAuthz('viewer'), 'wedding-1')).rejects.toThrow(TRPCError)
  })

  it('lists event stats with event.read permission', async () => {
    eventService.getWeddingEventsWithStats.mockResolvedValue([
      { id: 'event-1', guestResponses: {} },
    ])
    const result = await service.listEventsWithStats(buildAuthz('admin'), 'wedding-1')
    expect(result).toEqual([{ id: 'event-1', guestResponses: {} }])
  })

  it('lists invitations with guest_invitation.read permission', async () => {
    invitationService.getAllByWeddingId.mockResolvedValue([{ id: 'inv-1' }])
    const result = await service.listInvitations(buildAuthz('owner'), 'wedding-1')
    expect(result).toEqual([{ id: 'inv-1' }])
  })
})
