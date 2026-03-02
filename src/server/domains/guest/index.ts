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

// Export classes for testing/DI
export { GuestRepository } from '~/server/domains/guest/guest.repository'
// Export router
export { guestRouter } from '~/server/domains/guest/guest.router'
export { GuestService } from '~/server/domains/guest/guest.service'
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
  type CreateGuestSchemaInput,
  createGuestSchema,
  type GetByEventSchemaInput,
  type GetByHouseholdSchemaInput,
  type GuestIdSchemaInput,
  type GuestPartySchemaInput,
  getByEventSchema,
  getByHouseholdSchema,
  guestIdSchema,
  guestPartySchema,
  type UpdateGuestSchemaInput,
  updateGuestSchema,
} from '~/server/domains/guest/guest.validator'
