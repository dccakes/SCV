/**
 * Gift Domain - Service
 *
 * Business logic for the Gift domain.
 * Handles gift tracking, updates, and thank you status.
 */

import { type GiftRepository } from '~/server/domains/gift/gift.repository'
import { type Gift, type UpdateGiftInput, type UpsertGiftInput } from '~/server/domains/gift/gift.types'

export class GiftService {
  constructor(private giftRepository: GiftRepository) {}

  /**
   * Update a gift
   *
   * Business rules:
   * - Gift must exist (compound key: householdId + eventId)
   */
  async updateGift(data: UpdateGiftInput): Promise<Gift> {
    return this.giftRepository.update(data.householdId, data.eventId, {
      description: data.description,
      thankyou: data.thankyou,
    })
  }

  /**
   * Upsert a gift (create if not exists, update if exists)
   */
  async upsertGift(data: UpsertGiftInput): Promise<Gift> {
    return this.giftRepository.upsert({
      householdId: data.householdId,
      eventId: data.eventId,
      description: data.description,
      thankyou: data.thankyou,
    })
  }

  /**
   * Get a gift by ID
   */
  async getById(householdId: string, eventId: string): Promise<Gift | null> {
    return this.giftRepository.findById(householdId, eventId)
  }

  /**
   * Get all gifts for a household
   */
  async getByHouseholdId(householdId: string): Promise<Gift[]> {
    return this.giftRepository.findByHouseholdId(householdId)
  }

  /**
   * Get all gifts for an event
   */
  async getByEventId(eventId: string): Promise<Gift[]> {
    return this.giftRepository.findByEventId(eventId)
  }

  /**
   * Mark a thank you as sent
   */
  async markThankYouSent(householdId: string, eventId: string): Promise<Gift> {
    return this.giftRepository.update(householdId, eventId, {
      thankyou: true,
    })
  }

  /**
   * Create gifts for a household across multiple events
   */
  async createForHouseholdAndEvents(
    householdId: string,
    eventIds: string[]
  ): Promise<{ count: number }> {
    return this.giftRepository.createMany(
      eventIds.map((eventId) => ({
        householdId,
        eventId,
        thankyou: false,
      }))
    )
  }
}
