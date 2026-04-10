/**
 * Event Domain - Repository
 *
 * Database operations for the Event entity.
 * This layer handles all direct database access for events.
 */

import type { PrismaClient } from '@prisma/client'

import { DEFAULT_LIKELIHOOD_WEIGHT, LIKELIHOOD_WEIGHTS, RSVP_STATUS } from '~/lib/constants'
import type { Event, EventWithQuestions, EventWithStats } from '~/server/domains/event/event.types'

export class EventRepository {
  constructor(private db: PrismaClient) {}

  /**
   * Find an event by ID
   */
  async findById(id: string): Promise<Event | null> {
    return this.db.event.findUnique({
      where: { id },
    })
  }

  /**
   * Find an event by ID with questions included
   */
  async findByIdWithQuestions(id: string): Promise<EventWithQuestions | null> {
    return this.db.event.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { createdAt: 'asc' },
          include: {
            options: true,
            _count: {
              select: { answers: true },
            },
          },
        },
      },
    })
  }

  /**
   * Find all events for a wedding
   */
  async findByWeddingId(weddingId: string): Promise<Event[]> {
    return this.db.event.findMany({
      where: { weddingId },
      orderBy: { createdAt: 'asc' },
    })
  }

  /**
   * Find all events for a wedding with questions included
   */
  async findByWeddingIdWithQuestions(weddingId: string): Promise<EventWithQuestions[]> {
    return this.db.event.findMany({
      where: { weddingId },
      orderBy: { createdAt: 'asc' },
      include: {
        questions: {
          orderBy: { createdAt: 'asc' },
          include: {
            options: true,
            _count: {
              select: { answers: true },
            },
          },
        },
      },
    })
  }

  /**
   * Find all events for a wedding with RSVP statistics
   *
   * When an event has allowTagAlongs=false, tag-along guest invitations
   * are excluded from RSVP counts (preserved data is hidden from stats).
   */
  async findByWeddingIdWithStats(weddingId: string): Promise<EventWithStats[]> {
    const events = await this.db.event.findMany({
      where: { weddingId },
      orderBy: { createdAt: 'asc' },
      include: {
        invitations: {
          select: {
            rsvp: true,
            guest: {
              select: {
                isTagAlong: true,
                household: { select: { likelihoodOfAttending: true } },
              },
            },
          },
        },
      },
    })

    return events.map((event) => {
      const { invitations, ...eventData } = event

      // Filter out tag-along invitations when event doesn't allow them
      const countedInvitations = event.allowTagAlongs
        ? invitations
        : invitations.filter((inv) => !inv.guest.isTagAlong)

      // Count invitations by RSVP status
      const guestResponses = {
        attending: countedInvitations.filter((inv) => inv.rsvp === RSVP_STATUS.ATTENDING).length,
        invited: countedInvitations.filter((inv) => inv.rsvp === RSVP_STATUS.INVITED).length,
        declined: countedInvitations.filter((inv) => inv.rsvp === RSVP_STATUS.DECLINED).length,
        notInvited: countedInvitations.filter((inv) => inv.rsvp === RSVP_STATUS.NOT_INVITED).length,
      }

      // Estimate attendance: confirmed RSVPs count as-is, pending use likelihood weights
      const estimatedAttendance = Math.round(
        countedInvitations
          .filter((inv) => inv.rsvp !== RSVP_STATUS.NOT_INVITED)
          .reduce((sum, inv) => {
            if (inv.rsvp === RSVP_STATUS.ATTENDING) return sum + 1
            if (inv.rsvp === RSVP_STATUS.DECLINED) return sum
            const likelihood = inv.guest.household.likelihoodOfAttending
            const weight =
              likelihood != null
                ? (LIKELIHOOD_WEIGHTS[likelihood] ?? DEFAULT_LIKELIHOOD_WEIGHT)
                : DEFAULT_LIKELIHOOD_WEIGHT
            return sum + weight
          }, 0)
      )

      return {
        ...eventData,
        guestResponses,
        estimatedAttendance,
      }
    })
  }

  /**
   * Create a new event
   */
  async create(data: {
    name: string
    weddingId: string
    date?: Date
    startTime?: string
    endTime?: string
    venue?: string
    attire?: string
    description?: string
    collectRsvp?: boolean
    allowTagAlongs?: boolean
  }): Promise<Event> {
    return this.db.event.create({
      data: {
        name: data.name,
        weddingId: data.weddingId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        venue: data.venue,
        attire: data.attire,
        description: data.description,
        collectRsvp: data.collectRsvp ?? false,
        allowTagAlongs: data.allowTagAlongs ?? false,
      },
    })
  }

  /**
   * Update an existing event
   */
  async update(
    id: string,
    data: {
      name?: string
      date?: Date
      startTime?: string
      endTime?: string
      venue?: string
      attire?: string
      description?: string
      allowTagAlongs?: boolean
    }
  ): Promise<Event> {
    return this.db.event.update({
      where: { id },
      data: {
        name: data.name,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        venue: data.venue,
        attire: data.attire,
        description: data.description,
        allowTagAlongs: data.allowTagAlongs,
      },
    })
  }

  /**
   * Update collect RSVP status
   */
  async updateCollectRsvp(id: string, collectRsvp: boolean): Promise<Event> {
    return this.db.event.update({
      where: { id },
      data: { collectRsvp },
    })
  }

  /**
   * Delete an event
   */
  async delete(id: string): Promise<Event> {
    return this.db.event.delete({
      where: { id },
    })
  }

  /**
   * Check if an event exists
   */
  async exists(id: string): Promise<boolean> {
    const event = await this.db.event.findUnique({
      where: { id },
      select: { id: true },
    })
    return event !== null
  }

  /**
   * Check if an event belongs to a wedding
   */
  async belongsToWedding(id: string, weddingId: string): Promise<boolean> {
    const event = await this.db.event.findFirst({
      where: { id, weddingId },
      select: { id: true },
    })
    return event !== null
  }

  async belongsToUser(id: string, userId: string): Promise<boolean> {
    const event = await this.db.event.findFirst({
      where: {
        id,
        wedding: {
          userWeddings: {
            some: {
              userId,
            },
          },
        },
      },
      select: { id: true },
    })

    return event !== null
  }
}
