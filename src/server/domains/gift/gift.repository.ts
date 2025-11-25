/**
 * Gift Domain - Repository
 *
 * Database operations for the Gift entity.
 * This layer handles all direct database access for gifts.
 */

import { type PrismaClient } from '@prisma/client'

import { type Gift } from '~/server/domains/gift/gift.types'

export class GiftRepository {
  constructor(private db: PrismaClient) {}

  /**
   * Find a gift by compound ID (householdId + eventId)
   */
  async findById(householdId: string, eventId: string): Promise<Gift | null> {
    return this.db.gift.findUnique({
      where: {
        GiftId: {
          householdId,
          eventId,
        },
      },
    })
  }

  /**
   * Find all gifts for a household
   */
  async findByHouseholdId(householdId: string): Promise<Gift[]> {
    return this.db.gift.findMany({
      where: { householdId },
    })
  }

  /**
   * Find all gifts for an event
   */
  async findByEventId(eventId: string): Promise<Gift[]> {
    return this.db.gift.findMany({
      where: { eventId },
    })
  }

  /**
   * Create a new gift
   */
  async create(data: {
    householdId: string
    eventId: string
    description?: string
    thankyou?: boolean
  }): Promise<Gift> {
    return this.db.gift.create({
      data: {
        householdId: data.householdId,
        eventId: data.eventId,
        description: data.description,
        thankyou: data.thankyou ?? false,
      },
    })
  }

  /**
   * Create multiple gifts at once
   */
  async createMany(
    data: Array<{
      householdId: string
      eventId: string
      description?: string
      thankyou?: boolean
    }>
  ): Promise<{ count: number }> {
    return this.db.gift.createMany({
      data: data.map((gift) => ({
        householdId: gift.householdId,
        eventId: gift.eventId,
        description: gift.description,
        thankyou: gift.thankyou ?? false,
      })),
    })
  }

  /**
   * Update an existing gift
   */
  async update(
    householdId: string,
    eventId: string,
    data: {
      description?: string
      thankyou?: boolean
    }
  ): Promise<Gift> {
    return this.db.gift.update({
      where: {
        GiftId: {
          householdId,
          eventId,
        },
      },
      data: {
        description: data.description,
        thankyou: data.thankyou,
      },
    })
  }

  /**
   * Upsert a gift (create if not exists, update if exists)
   */
  async upsert(data: {
    householdId: string
    eventId: string
    description?: string | null
    thankyou: boolean
  }): Promise<Gift> {
    return this.db.gift.upsert({
      where: {
        GiftId: {
          householdId: data.householdId,
          eventId: data.eventId,
        },
      },
      update: {
        description: data.description,
        thankyou: data.thankyou,
      },
      create: {
        householdId: data.householdId,
        eventId: data.eventId,
        description: data.description,
        thankyou: data.thankyou,
      },
    })
  }

  /**
   * Delete a gift
   */
  async delete(householdId: string, eventId: string): Promise<Gift> {
    return this.db.gift.delete({
      where: {
        GiftId: {
          householdId,
          eventId,
        },
      },
    })
  }

  /**
   * Check if a gift exists
   */
  async exists(householdId: string, eventId: string): Promise<boolean> {
    const gift = await this.db.gift.findUnique({
      where: {
        GiftId: {
          householdId,
          eventId,
        },
      },
      select: { householdId: true },
    })
    return gift !== null
  }
}
