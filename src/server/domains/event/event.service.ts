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

// biome-ignore lint/style/noRestrictedImports: architectural violation, tracked in ARCHITECTURAL_VIOLATIONS.md
import type { PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'

import { RSVP_STATUS } from '~/lib/constants/rsvp'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { EventRepository } from '~/server/domains/event/event.repository'
import type { Event, EventWithStats } from '~/server/domains/event/event.types'
import type { CreateEventInput, UpdateEventInput } from '~/server/domains/event/event.validator'

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
   *
   * Wrapped in a transaction to ensure event + invitations are created atomically.
   */
  async createEvent(ctx: AuthzContext, weddingId: string, data: CreateEventInput): Promise<Event> {
    this.requireEventPermission(ctx, 'create')
    return this.createEventCore(weddingId, data)
  }

  async createEventSystem(weddingId: string, data: CreateEventInput): Promise<Event> {
    return this.createEventCore(weddingId, data)
  }

  private createEventCore(weddingId: string, data: CreateEventInput): Promise<Event> {
    const {
      eventName: name,
      date,
      startTime,
      endTime,
      venue,
      attire,
      description,
      allowTagAlongs,
    } = data

    return this.db.$transaction(async (tx) => {
      // Create the event
      const newEvent = await tx.event.create({
        data: {
          name,
          weddingId,
          date: date ? new Date(date) : undefined,
          startTime,
          endTime,
          venue,
          attire,
          description,
          collectRsvp: false,
          allowTagAlongs: allowTagAlongs ?? false,
        },
      })

      // Create invitations for pre-existing guests
      // Tag-alongs only get invitations if this event allows them
      const guests = await tx.guest.findMany({
        where: { weddingId, ...(allowTagAlongs ? {} : { isTagAlong: false }) },
      })

      if (guests.length > 0) {
        await tx.invitation.createMany({
          data: guests.map((guest) => ({
            weddingId,
            guestId: guest.id,
            eventId: newEvent.id,
            rsvp: RSVP_STATUS.NOT_INVITED,
          })),
        })
      }

      return newEvent as Event
    })
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
   *
   * When allowTagAlongs changes:
   * - false → true: Create invitations for tag-alongs that don't already have one (idempotent)
   * - true → false: Preserve existing invitations (flag controls visibility in counts/display)
   *
   * Wrapped in a transaction to ensure tag-along invitation creation + event update are atomic.
   */
  async updateEvent(ctx: AuthzContext, weddingId: string, data: UpdateEventInput): Promise<Event> {
    this.requireEventPermission(ctx, 'update')

    return this.db.$transaction(async (tx) => {
      // Check if allowTagAlongs is being toggled on; also verifies event belongs to this wedding
      const currentEvent = await tx.event.findUnique({ where: { id: data.eventId } })
      if (!currentEvent || currentEvent.weddingId !== weddingId) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      const wasAllowed = currentEvent.allowTagAlongs
      const nowAllowed = data.allowTagAlongs ?? false

      if (!wasAllowed && nowAllowed) {
        // Create invitations only for tag-alongs that don't already have one for this event
        const tagAlongGuests = await tx.guest.findMany({
          where: {
            weddingId,
            isTagAlong: true,
            invitations: { none: { eventId: data.eventId } },
          },
        })

        if (tagAlongGuests.length > 0) {
          await tx.invitation.createMany({
            data: tagAlongGuests.map((guest) => ({
              weddingId,
              guestId: guest.id,
              eventId: data.eventId,
              rsvp: RSVP_STATUS.NOT_INVITED,
            })),
          })
        }
      }
      // When toggling off (wasAllowed && !nowAllowed): do nothing.
      // Invitations are preserved — the allowTagAlongs flag controls
      // whether they appear in counts and display.

      const updated = await tx.event.update({
        where: { id: data.eventId },
        data: {
          name: data.eventName,
          date: data.date ? new Date(data.date) : undefined,
          startTime: data.startTime,
          endTime: data.endTime,
          venue: data.venue,
          attire: data.attire,
          description: data.description,
          allowTagAlongs: data.allowTagAlongs,
        },
      })

      return updated as Event
    })
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
      throw new TRPCError({ code: 'FORBIDDEN' })
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
