/**
 * Self-Fill Domain - Barrel Export
 *
 * Token management only. Guest registration orchestration lives in:
 *   ~/server/application/self-fill-registration
 */

import { SelfFillRepository } from '~/server/domains/self-fill/self-fill.repository'
import { SelfFillService } from '~/server/domains/self-fill/self-fill.service'
import { db } from '~/server/infrastructure/database'

// Create singleton instances (token management only)
const selfFillRepository = new SelfFillRepository(db)

export const selfFillService = new SelfFillService(selfFillRepository)

// Export classes for testing/DI
export { SelfFillRepository } from '~/server/domains/self-fill/self-fill.repository'
// Export router factory (created at root.ts with injected registration service)
export { createSelfFillRouter } from '~/server/domains/self-fill/self-fill.router'
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
