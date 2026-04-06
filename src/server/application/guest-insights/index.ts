import { GuestInsightsService } from '~/server/application/guest-insights/guest-insights.service'
import { EventRepository } from '~/server/domains/event/event.repository'
import { EventService } from '~/server/domains/event/event.service'
import { GuestRepository } from '~/server/domains/guest/guest.repository'
import { GuestService } from '~/server/domains/guest/guest.service'
import { InvitationRepository } from '~/server/domains/invitation/invitation.repository'
import { InvitationService } from '~/server/domains/invitation/invitation.service'
import { db } from '~/server/infrastructure/database'

export const guestInsightsService = new GuestInsightsService(
  new GuestService(new GuestRepository(db)),
  new InvitationService(new InvitationRepository(db)),
  new EventService(new EventRepository(db), db)
)

export { GuestInsightsService } from '~/server/application/guest-insights/guest-insights.service'
