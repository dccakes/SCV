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

// Export classes for testing/DI
export { GiftRepository } from '~/server/domains/gift/gift.repository'
// Export router
export { giftRouter } from '~/server/domains/gift/gift.router'
export { GiftService } from '~/server/domains/gift/gift.service'
// Export types
export type {
  CreateGiftInput,
  Gift,
  UpdateGiftInput,
  UpsertGiftInput,
} from '~/server/domains/gift/gift.types'
// Export validators
export {
  type CreateGiftSchemaInput,
  createGiftSchema,
  type GiftIdSchemaInput,
  giftIdSchema,
  type UpdateGiftSchemaInput,
  type UpsertGiftSchemaInput,
  updateGiftSchema,
  upsertGiftSchema,
} from '~/server/domains/gift/gift.validator'
