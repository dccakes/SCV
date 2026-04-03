import { EventInsightsService } from '~/server/application/event-insights/event-insights.service'
import { eventService } from '~/server/domains/event'
import { invitationService } from '~/server/domains/invitation'

export const eventInsightsService = new EventInsightsService(eventService, invitationService)

export { EventInsightsService } from '~/server/application/event-insights/event-insights.service'
