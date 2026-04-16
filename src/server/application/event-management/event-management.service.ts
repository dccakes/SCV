/**
 * Event Management Application Service
 *
 * Orchestrates cross-domain operations for event management:
 * - Event creation with auto-invitation generation
 * - Event updates with tag-along invitation management
 *
 * Extracted from EventService to properly separate domain logic
 * from application-level orchestration.
 */

// biome-ignore lint/style/noRestrictedImports: Application services use PrismaClient for cross-domain transactions
import type { PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'

import { RSVP_STATUS } from '~/lib/constants'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { EventRepository } from '~/server/domains/event/event.repository'
import type { Event } from '~/server/domains/event/event.types'
import type { CreateEventInput, UpdateEventInput } from '~/server/domains/event/event.validator'

export class EventManagementService {
  constructor(
    private eventRepo: EventRepository,
    private db: PrismaClient
  ) {}

  /**
   * Create a new event with auto-generated invitations
   *
   * Business rules:
   * - Auto-creates invitations for all existing guests with "Not Invited" status
   * - Tag-alongs only get invitations if the event allows them
   */
  async createEvent(ctx: AuthzContext, weddingId: string, data: CreateEventInput): Promise<Event> {
    this.requireEventPermission(ctx, 'create')

    const {
      eventName: name,
      date,
      startTime,
      endTime,
      venue,
      attire,
      description,
      collectRsvp,
      allowTagAlongs,
    } = data

    return this.db.$transaction(async (tx) => {
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
          collectRsvp: collectRsvp ?? false,
          allowTagAlongs: allowTagAlongs ?? false,
        },
      })

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
   * Update an existing event with tag-along invitation management
   *
   * When allowTagAlongs changes:
   * - false -> true: Create invitations for tag-alongs that don't already have one
   * - true -> false: Preserve existing invitations (flag controls visibility)
   */
  async updateEvent(ctx: AuthzContext, weddingId: string, data: UpdateEventInput): Promise<Event> {
    this.requireEventPermission(ctx, 'update')

    const belongsToWedding = await this.eventRepo.belongsToWedding(data.eventId, weddingId)
    if (!belongsToWedding) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this event',
      })
    }

    return this.db.$transaction(async (tx) => {
      const currentEvent = await tx.event.findUnique({ where: { id: data.eventId } })
      const wasAllowed = currentEvent?.allowTagAlongs ?? false
      const nowAllowed = data.allowTagAlongs ?? false

      if (!wasAllowed && nowAllowed) {
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
          collectRsvp: data.collectRsvp,
          allowTagAlongs: data.allowTagAlongs,
        },
      })

      return updated as Event
    })
  }

  /**
   * Delete an event.
   *
   * Note: Cascades to invitations, gifts, and questions via database relations.
   */
  async deleteEvent(ctx: AuthzContext, weddingId: string, eventId: string): Promise<string> {
    this.requireEventPermission(ctx, 'delete')

    const belongsToWedding = await this.eventRepo.belongsToWedding(eventId, weddingId)
    if (!belongsToWedding) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to delete this event',
      })
    }

    const deleted = await this.eventRepo.delete(eventId)
    return deleted.id
  }

  private requireEventPermission(ctx: AuthzContext, action: 'create' | 'update' | 'delete'): void {
    requirePermission(ctx, {
      event: [action],
    })
  }
}
