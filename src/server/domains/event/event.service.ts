/**
 * Event Domain - Service
 *
 * Business logic for the Event domain.
 * Handles event creation, updates, deletion, and retrieval.
 *
 * Note: Event creation auto-creates invitations for existing guests.
 * This is a cross-domain operation but is kept here for Phase 1.
 */

import { TRPCError } from '@trpc/server'
import { type PrismaClient, type Guest as PrismaGuest } from '@prisma/client'

import { RSVP_STATUS } from '~/lib/constants'

import { type Event, type CreateEventInput, type UpdateEventInput } from './event.types'
import { type EventRepository } from './event.repository'

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
  async createEvent(userId: string, data: CreateEventInput): Promise<Event> {
    const { eventName: name, date, startTime, endTime, venue, attire, description } = data

    // Create the event
    const newEvent = await this.eventRepository.create({
      name,
      userId,
      date: date ? new Date(date) : undefined,
      startTime,
      endTime,
      venue,
      attire,
      description,
    })

    // Create invitations for all pre-existing guests
    const guests = await this.db.guest.findMany({
      where: { userId },
    })

    await Promise.all(
      guests.map(async (guest: PrismaGuest) => {
        await this.db.invitation.create({
          data: {
            userId,
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
   * Get all events for a user
   */
  async getUserEvents(userId: string | null): Promise<Event[] | undefined> {
    if (!userId) {
      return undefined
    }
    return this.eventRepository.findByUserId(userId)
  }

  /**
   * Get an event by ID with authorization check
   */
  async getById(eventId: string, userId: string): Promise<Event> {
    const event = await this.eventRepository.findById(eventId)

    if (!event) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Event not found',
      })
    }

    // Check ownership
    if (event.userId !== userId) {
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
  async updateEvent(userId: string, data: UpdateEventInput): Promise<Event> {
    // Verify event belongs to user
    const belongsToUser = await this.eventRepository.belongsToUser(data.eventId, userId)
    if (!belongsToUser) {
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
  async deleteEvent(eventId: string, userId: string): Promise<string> {
    // Verify event belongs to user
    const belongsToUser = await this.eventRepository.belongsToUser(eventId, userId)
    if (!belongsToUser) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to delete this event',
      })
    }

    const deletedEvent = await this.eventRepository.delete(eventId)
    return deletedEvent.id
  }
}
