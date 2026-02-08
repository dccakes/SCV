/**
 * Event Domain - Service
 *
 * Business logic for the Event domain.
 * Handles event creation, updates, deletion, and retrieval.
 *
 * Note: Event creation auto-creates invitations for existing guests.
 * This is a cross-domain operation but is kept here for Phase 1.
 *
 * TODO: ARCHITECTURAL VIOLATION - This service directly accesses PrismaClient
 * for cross-domain operations (fetching guests, creating invitations). The
 * invitation creation logic should be moved to an Application Service that
 * orchestrates EventService and InvitationService. See ARCHITECTURAL_VIOLATIONS.md
 * for details.
 */

import { type Guest as PrismaGuest, type PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'

import { RSVP_STATUS } from '~/lib/constants'
import { type EventRepository } from '~/server/domains/event/event.repository'
import { type Event, type EventWithStats } from '~/server/domains/event/event.types'
import {
  type CreateEventInput,
  type UpdateEventInput,
} from '~/server/domains/event/event.validator'

export class EventService {
  constructor(
    private eventRepository: EventRepository,
    private db: PrismaClient
  ) {}

  /**
   * Create a new event
   *
   * Business rules:
   * - Event date cannot be in the past (optional rule, currently not enforced)
   * - Auto-creates invitations for all existing guests with "Not Invited" status
   */
  async createEvent(weddingId: string, data: CreateEventInput): Promise<Event> {
    const { eventName: name, date, startTime, endTime, venue, attire, description } = data

    // Create the event
    const newEvent = await this.eventRepository.create({
      name,
      weddingId,
      date: date ? new Date(date) : undefined,
      startTime,
      endTime,
      venue,
      attire,
      description,
    })

    // Create invitations for all pre-existing guests
    const guests = await this.db.guest.findMany({
      where: { weddingId },
    })

    await Promise.all(
      guests.map(async (guest: PrismaGuest) => {
        await this.db.invitation.create({
          data: {
            weddingId,
            guestId: guest.id,
            eventId: newEvent.id,
            rsvp: RSVP_STATUS.NOT_INVITED,
          },
        })
      })
    )

    return newEvent
  }

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
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Event not found',
      })
    }

    // Check ownership
    if (event.weddingId !== weddingId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this event',
      })
    }

    return event
  }

  /**
   * Update an existing event
   */
  async updateEvent(weddingId: string, data: UpdateEventInput): Promise<Event> {
    // Verify event belongs to wedding
    const belongsToWedding = await this.eventRepository.belongsToWedding(data.eventId, weddingId)
    if (!belongsToWedding) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this event',
      })
    }

    return this.eventRepository.update(data.eventId, {
      name: data.eventName,
      date: data.date ? new Date(data.date) : undefined,
      startTime: data.startTime,
      endTime: data.endTime,
      venue: data.venue,
      attire: data.attire,
      description: data.description,
    })
  }

  /**
   * Update collect RSVP status for an event
   */
  async updateCollectRsvp(eventId: string, collectRsvp: boolean): Promise<Event> {
    return this.eventRepository.updateCollectRsvp(eventId, collectRsvp)
  }

  /**
   * Delete an event
   *
   * Note: Cascades to invitations, gifts, and questions via database relations
   */
  async deleteEvent(eventId: string, weddingId: string): Promise<string> {
    // Verify event belongs to wedding
    const belongsToWedding = await this.eventRepository.belongsToWedding(eventId, weddingId)
    if (!belongsToWedding) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to delete this event',
      })
    }

    const deletedEvent = await this.eventRepository.delete(eventId)
    return deletedEvent.id
  }
}
