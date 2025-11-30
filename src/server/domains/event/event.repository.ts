/**
 * Event Domain - Repository
 *
 * Database operations for the Event entity.
 * This layer handles all direct database access for events.
 */

import { type PrismaClient } from '@prisma/client'

import { RSVP_STATUS } from '~/lib/constants'
import { type Event, type EventWithQuestions, type EventWithStats } from '~/server/domains/event/event.types'

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
   */
  async findByWeddingIdWithStats(weddingId: string): Promise<EventWithStats[]> {
    const events = await this.db.event.findMany({
      where: { weddingId },
      orderBy: { createdAt: 'asc' },
      include: {
        invitations: {
          select: {
            rsvp: true,
          },
        },
      },
    })

    return events.map((event) => {
      const { invitations, ...eventData } = event

      // Count invitations by RSVP status
      const guestResponses = {
        attending: invitations.filter((inv) => inv.rsvp === RSVP_STATUS.ATTENDING).length,
        invited: invitations.filter((inv) => inv.rsvp === RSVP_STATUS.INVITED).length,
        declined: invitations.filter((inv) => inv.rsvp === RSVP_STATUS.DECLINED).length,
        notInvited: invitations.filter((inv) => inv.rsvp === RSVP_STATUS.NOT_INVITED).length,
      }

      return {
        ...eventData,
        guestResponses,
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
}
