/**
 * Event Management Application Service
 *
 * Orchestrates cross-domain operations for event management:
 * - Event creation with auto-invitation generation
 * - Event updates with tag-along invitation management
 *
 * Multi-repository writes run through a UnitOfWork so they commit atomically
 * without this service depending on Prisma.
 */

import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import { checklistSeedingService } from '~/server/domains/checklist'
import type { ChecklistSeedingRepository } from '~/server/domains/checklist/checklist-seeding.repository'
import type { EventRepository } from '~/server/domains/event/event.repository'
import type { Event } from '~/server/domains/event/event.types'
import type { CreateEventInput, UpdateEventInput } from '~/server/domains/event/event.validator'
import type { GuestRepository } from '~/server/domains/guest/guest.repository'
import type { InvitationRepository } from '~/server/domains/invitation/invitation.repository'
import { RSVP_STATUS } from '~/server/domains/invitation/rsvp-status'
import { ForbiddenError } from '~/server/domains/shared/domain-error'
import type { UnitOfWork } from '~/server/infrastructure/database/unit-of-work'

export type EventManagementRepos = {
  event: EventRepository
  guest: GuestRepository
  invitation: InvitationRepository
  checklist: ChecklistSeedingRepository
}

export class EventManagementService {
  constructor(
    private eventRepo: EventRepository,
    private unitOfWork: UnitOfWork<EventManagementRepos>
  ) {}

  /**
   * Create a new event with auto-generated invitations
   *
   * Business rules:
   * - Auto-creates invitations for all existing guests with "Not Invited" status
   * - Tag-alongs only get invitations if the event allows them
   * - Seeds the planning checklist against the first event, in the same transaction
   */
  async createEvent(ctx: AuthzContext, weddingId: string, data: CreateEventInput): Promise<Event> {
    this.requireEventPermission(ctx, 'create')

    return this.unitOfWork(async (repos) => {
      const event = await this.insertEventWithInvitations(repos, weddingId, data)
      await checklistSeedingService.ensureSeeded(weddingId, repos.checklist)
      return event
    })
  }

  /**
   * Create an event on the system's behalf (wedding provisioning). No
   * permission check and no checklist seeding: the caller seeds afterwards.
   */
  async createEventSystem(weddingId: string, data: CreateEventInput): Promise<Event> {
    return this.unitOfWork((repos) => this.insertEventWithInvitations(repos, weddingId, data))
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
      throw new ForbiddenError('You do not have permission to update this event')
    }

    return this.unitOfWork(async (repos) => {
      const currentEvent = await repos.event.findById(data.eventId)
      const wasAllowed = currentEvent?.allowTagAlongs ?? false
      const nowAllowed = data.allowTagAlongs ?? false

      if (!wasAllowed && nowAllowed) {
        const tagAlongIds = await repos.guest.findTagAlongIdsWithoutInvitation(
          weddingId,
          data.eventId
        )
        await this.inviteAsNotInvited(repos, weddingId, data.eventId, tagAlongIds)
      }

      return repos.event.update(data.eventId, {
        name: data.eventName,
        date: data.date ? new Date(data.date) : undefined,
        startTime: data.startTime,
        endTime: data.endTime,
        venue: data.venue,
        attire: data.attire,
        description: data.description,
        collectRsvp: data.collectRsvp,
        allowTagAlongs: data.allowTagAlongs,
      })
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
      throw new ForbiddenError('You do not have permission to delete this event')
    }

    const deleted = await this.eventRepo.delete(eventId)
    return deleted.id
  }

  private async insertEventWithInvitations(
    repos: EventManagementRepos,
    weddingId: string,
    data: CreateEventInput
  ): Promise<Event> {
    const event = await repos.event.create({
      name: data.eventName,
      weddingId,
      date: data.date ? new Date(data.date) : undefined,
      startTime: data.startTime,
      endTime: data.endTime,
      venue: data.venue,
      attire: data.attire,
      description: data.description,
      collectRsvp: data.collectRsvp ?? false,
      allowTagAlongs: data.allowTagAlongs ?? false,
    })

    const guestIds = await repos.guest.findIdsForNewEvent(weddingId, {
      includeTagAlongs: data.allowTagAlongs ?? false,
    })
    await this.inviteAsNotInvited(repos, weddingId, event.id, guestIds)

    return event
  }

  private async inviteAsNotInvited(
    repos: EventManagementRepos,
    weddingId: string,
    eventId: string,
    guestIds: number[]
  ): Promise<void> {
    if (guestIds.length === 0) return
    await repos.invitation.createMany(
      guestIds.map((guestId) => ({
        guestId,
        eventId,
        rsvp: RSVP_STATUS.NOT_INVITED,
        weddingId,
      }))
    )
  }

  private requireEventPermission(ctx: AuthzContext, action: 'create' | 'update' | 'delete'): void {
    requirePermission(ctx, {
      event: [action],
    })
  }
}
