/**
 * Self-Fill Domain - Barrel Export
 *
 * Exports all self-fill domain components for use throughout the application.
 */

import { GuestRepository } from '~/server/domains/guest/guest.repository'
import { HouseholdRepository } from '~/server/domains/household/household.repository'
import { SelfFillRepository } from '~/server/domains/self-fill/self-fill.repository'
import { SelfFillService } from '~/server/domains/self-fill/self-fill.service'
import { db } from '~/server/infrastructure/database'

// Create singleton instances
const selfFillRepository = new SelfFillRepository(db)
const householdRepository = new HouseholdRepository(db)
const guestRepository = new GuestRepository(db)

export const selfFillService = new SelfFillService(
  selfFillRepository,
  householdRepository,
  guestRepository
)

// Export classes for testing/DI
export { SelfFillRepository } from '~/server/domains/self-fill/self-fill.repository'
// Export router
export { selfFillRouter } from '~/server/domains/self-fill/self-fill.router'
export { SelfFillService } from '~/server/domains/self-fill/self-fill.service'
// Export types
export type {
  SelfFillEvent,
  SelfFillGuestInput,
  SelfFillRegistrationResult,
  SelfFillWeddingData,
} from '~/server/domains/self-fill/self-fill.types'
// Export validators
export {
  type GenerateTokenSchemaInput,
  type GetByTokenSchemaInput,
  generateTokenSchema,
  getByTokenSchema,
  type RevokeTokenSchemaInput,
  revokeTokenSchema,
  type SelfFillGuestSchemaInput,
  selfFillGuestSchema,
} from '~/server/domains/self-fill/self-fill.validator'
