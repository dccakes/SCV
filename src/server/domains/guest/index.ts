/**
 * Guest Domain - Barrel Export
 *
 * Exports all guest domain components for use throughout the application.
 */

import { GuestRepository } from '~/server/domains/guest/guest.repository'
import { GuestService } from '~/server/domains/guest/guest.service'
import { db } from '~/server/infrastructure/database'

// Create singleton instances
const guestRepository = new GuestRepository(db)
export const guestService = new GuestService(guestRepository)

// Export types
export type {
  CreateGuestInput,
  Guest,
  GuestPartyInput,
  GuestWithInvitations,
  UpdateGuestInput,
} from '~/server/domains/guest/guest.types'

// Export validators
export {
  createGuestSchema,
  type CreateGuestSchemaInput,
  getByEventSchema,
  type GetByEventSchemaInput,
  getByHouseholdSchema,
  type GetByHouseholdSchemaInput,
  guestIdSchema,
  type GuestIdSchemaInput,
  guestPartySchema,
  type GuestPartySchemaInput,
  updateGuestSchema,
  type UpdateGuestSchemaInput,
} from '~/server/domains/guest/guest.validator'

// Export classes for testing/DI
export { GuestRepository } from '~/server/domains/guest/guest.repository'
export { GuestService } from '~/server/domains/guest/guest.service'

// Export router
export { guestRouter } from '~/server/domains/guest/guest.router'
