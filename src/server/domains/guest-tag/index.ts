/**
 * Guest Tag Domain - Barrel Export
 *
 * Exports all guest tag domain components for use throughout the application.
 */

import { GuestTagRepository } from '~/server/domains/guest-tag/guest-tag.repository'
import { GuestTagService } from '~/server/domains/guest-tag/guest-tag.service'
import { db } from '~/server/infrastructure/database'

// Create singleton instances
const guestTagRepository = new GuestTagRepository(db)
export const guestTagService = new GuestTagService(guestTagRepository)

// Export types
export type {
  CreateGuestTagInput,
  GuestTag,
  GuestTagWithGuestCount,
  UpdateGuestTagInput,
} from '~/server/domains/guest-tag/guest-tag.types'

// Export validators
export {
  createGuestTagSchema,
  guestTagIdSchema,
  updateGuestTagSchema,
} from '~/server/domains/guest-tag/guest-tag.validator'

// Export classes for testing/DI
export { GuestTagRepository } from '~/server/domains/guest-tag/guest-tag.repository'
export { GuestTagService } from '~/server/domains/guest-tag/guest-tag.service'

// Export router
export { guestTagRouter } from '~/server/domains/guest-tag/guest-tag.router'
