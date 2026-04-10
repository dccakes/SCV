/**
 * Gift Domain - Service
 *
 * Business logic for the Gift domain.
 * Handles gift tracking, updates, and thank you status.
 */

import { TRPCError } from '@trpc/server'

import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { GiftRepository } from '~/server/domains/gift/gift.repository'
import type { Gift, UpdateGiftInput, UpsertGiftInput } from '~/server/domains/gift/gift.types'

export class GiftService {
  constructor(private giftRepository: GiftRepository) {}

  /**
   * Update a gift
   *
   * Business rules:
   * - Gift must exist (compound key: householdId + eventId)
   */
  async updateGift(ctx: AuthzContext, weddingId: string, data: UpdateGiftInput): Promise<Gift> {
    requirePermission(ctx, { guest: ['update'] })

    const inScope = await this.giftRepository.belongsToWedding(
      data.householdId,
      data.eventId,
      weddingId
    )
    if (!inScope) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this gift',
      })
    }

    return this.giftRepository.update(data.householdId, data.eventId, {
      description: data.description,
      thankyou: data.thankyou,
      thankYouSentAt: data.thankyou ? new Date() : null,
    })
  }

  /**
   * Upsert a gift (create if not exists, update if exists)
   *
   * Internal system method — called only from already-authorized application services
   * (e.g. HouseholdManagementService). Do NOT call from routers directly.
   */
  async upsertGift(data: UpsertGiftInput): Promise<Gift> {
    return this.giftRepository.upsert({
      householdId: data.householdId,
      eventId: data.eventId,
      description: data.description,
      thankyou: data.thankyou,
      thankYouSentAt: data.thankyou ? new Date() : null,
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
   *
   * Internal system method — called only from already-authorized application services.
   * Do NOT call from routers directly.
   */
  async markThankYouSent(householdId: string, eventId: string): Promise<Gift> {
    return this.giftRepository.update(householdId, eventId, {
      thankyou: true,
      thankYouSentAt: new Date(),
    })
  }

  /**
   * Create gifts for a household across multiple events
   *
   * Internal system method — called only from already-authorized application services.
   * Do NOT call from routers directly.
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
