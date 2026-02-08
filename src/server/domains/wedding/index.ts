/**
 * Wedding Domain - Barrel Export
 *
 * Exports all wedding domain components for use throughout the application.
 */

import { eventService } from '~/server/domains/event'
import { guestTagService } from '~/server/domains/guest-tag'
import { WeddingRepository } from '~/server/domains/wedding/wedding.repository'
import { WeddingService } from '~/server/domains/wedding/wedding.service'
import { db } from '~/server/infrastructure/database'

// Create singleton instances
const weddingRepository = new WeddingRepository(db)
export const weddingService = new WeddingService(weddingRepository, eventService, guestTagService)

// Export types
export type {
  CreateWeddingInput,
  UpdateWeddingInput,
  UserWedding,
  Wedding,
} from '~/server/domains/wedding/wedding.types'

// Export validators
export {
  createWeddingSchema,
  type CreateWeddingSchemaInput,
  getByUserIdSchema,
  updateWeddingSchema,
  type UpdateWeddingSchemaInput,
} from '~/server/domains/wedding/wedding.validator'

// Export classes for testing/DI
export { WeddingRepository } from '~/server/domains/wedding/wedding.repository'
export { WeddingService } from '~/server/domains/wedding/wedding.service'

// Export router
export { weddingRouter } from '~/server/domains/wedding/wedding.router'
