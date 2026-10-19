/**
 * Event Domain - Service
 *
 * Business logic for the Event domain: retrieval, collect-RSVP toggling and
 * deletion. Creating and updating events also writes invitations, so those
 * live in the EventManagementService application service.
 */

import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { EventRepository } from '~/server/domains/event/event.repository'
import type { Event, EventWithStats } from '~/server/domains/event/event.types'
import { ForbiddenError, NotFoundError } from '~/server/domains/shared/domain-error'

export class EventService {
  constructor(private eventRepository: EventRepository) {}

  /**
   * Get all events for a wedding
   */
  async getWeddingEvents(weddingId: string | null): Promise<Event[] | undefined> {
    if (!weddingId) {
      return undefined
    }
    return this.eventRepository.findByWeddingId(weddingId)
  }

  /**
   * Get all events for a wedding with RSVP statistics
   */
  async getWeddingEventsWithStats(weddingId: string | null): Promise<EventWithStats[] | undefined> {
    if (!weddingId) {
      return undefined
    }
    return this.eventRepository.findByWeddingIdWithStats(weddingId)
  }

  /**
   * Get an event by ID with authorization check
   */
  async getById(eventId: string, weddingId: string): Promise<Event> {
    const event = await this.eventRepository.findById(eventId)

    if (!event) {
      throw new NotFoundError('Event not found')
    }

    // Check ownership
    if (event.weddingId !== weddingId) {
      throw new ForbiddenError('You do not have permission to access this event')
    }

    return event
  }

  /**
   * Update collect RSVP status for an event
   */
  async updateCollectRsvp(
    ctx: AuthzContext,
    weddingId: string,
    eventId: string,
    collectRsvp: boolean
  ): Promise<Event> {
    this.requireEventPermission(ctx, 'rsvp_policy_update')
    await this.assertEventInWedding(eventId, weddingId)

    return this.eventRepository.updateCollectRsvp(eventId, collectRsvp)
  }

  /**
   * Delete an event
   *
   * Note: Cascades to invitations, gifts, and questions via database relations
   */
  async deleteEvent(ctx: AuthzContext, weddingId: string, eventId: string): Promise<string> {
    this.requireEventPermission(ctx, 'delete')
    await this.assertEventInWedding(eventId, weddingId)

    const deletedEvent = await this.eventRepository.delete(eventId)
    return deletedEvent.id
  }

  private async assertEventInWedding(eventId: string, weddingId: string): Promise<void> {
    const belongs = await this.eventRepository.belongsToWedding(eventId, weddingId)
    if (!belongs) {
      throw new ForbiddenError()
    }
  }

  private requireEventPermission(
    ctx: AuthzContext,
    action: 'create' | 'update' | 'delete' | 'rsvp_policy_update'
  ): void {
    requirePermission(ctx, {
      event: [action],
    })
  }
}
