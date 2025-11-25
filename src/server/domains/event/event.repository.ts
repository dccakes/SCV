/**
 * Event Domain - Repository
 *
 * Database operations for the Event entity.
 * This layer handles all direct database access for events.
 */

import { type PrismaClient } from '@prisma/client'

import { type Event, type EventWithQuestions } from '~/server/domains/event/event.types'

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
   * Find all events for a user
   */
  async findByUserId(userId: string): Promise<Event[]> {
    return this.db.event.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })
  }

  /**
   * Find all events for a user with questions included
   */
  async findByUserIdWithQuestions(userId: string): Promise<EventWithQuestions[]> {
    return this.db.event.findMany({
      where: { userId },
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
   * Create a new event
   */
  async create(data: {
    name: string
    userId: string
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
        userId: data.userId,
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
   * Check if an event belongs to a user
   */
  async belongsToUser(id: string, userId: string): Promise<boolean> {
    const event = await this.db.event.findFirst({
      where: { id, userId },
      select: { id: true },
    })
    return event !== null
  }
}
