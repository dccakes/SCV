/**
 * Gift Domain - Barrel Export
 *
 * Exports all gift domain components for use throughout the application.
 */

import { GiftRepository } from '~/server/domains/gift/gift.repository'
import { GiftService } from '~/server/domains/gift/gift.service'
import { db } from '~/server/infrastructure/database'

// Create singleton instances
const giftRepository = new GiftRepository(db)
export const giftService = new GiftService(giftRepository)

// Export types
export type {
  CreateGiftInput,
  Gift,
  UpdateGiftInput,
  UpsertGiftInput,
} from '~/server/domains/gift/gift.types'

// Export validators
export {
  createGiftSchema,
  type CreateGiftSchemaInput,
  giftIdSchema,
  type GiftIdSchemaInput,
  updateGiftSchema,
  type UpdateGiftSchemaInput,
  upsertGiftSchema,
  type UpsertGiftSchemaInput,
} from '~/server/domains/gift/gift.validator'

// Export classes for testing/DI
export { GiftRepository } from '~/server/domains/gift/gift.repository'
export { GiftService } from '~/server/domains/gift/gift.service'

// Export router
export { giftRouter } from '~/server/domains/gift/gift.router'
