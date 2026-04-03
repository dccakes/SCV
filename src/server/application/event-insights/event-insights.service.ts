import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { EventService } from '~/server/domains/event/event.service'
import type { Event, EventWithStats } from '~/server/domains/event/event.types'
import type { InvitationService } from '~/server/domains/invitation/invitation.service'
import type { Invitation } from '~/server/domains/invitation/invitation.types'

export class EventInsightsService {
  constructor(
    private eventService: Pick<EventService, 'getWeddingEvents' | 'getWeddingEventsWithStats'>,
    private invitationService: Pick<InvitationService, 'getAllByWeddingId'>
  ) {}

  async listEvents(authz: AuthzContext, weddingId: string): Promise<Event[]> {
    requirePermission(authz, { event: ['read'] })
    const events = await this.eventService.getWeddingEvents(weddingId)
    return events ?? []
  }

  async listEventsWithStats(authz: AuthzContext, weddingId: string): Promise<EventWithStats[]> {
    requirePermission(authz, { event: ['read'] })
    const events = await this.eventService.getWeddingEventsWithStats(weddingId)
    return events ?? []
  }

  async listInvitations(authz: AuthzContext, weddingId: string): Promise<Invitation[]> {
    requirePermission(authz, { guest_invitation: ['read'] })
    const invitations = await this.invitationService.getAllByWeddingId(weddingId)
    return invitations ?? []
  }
}
