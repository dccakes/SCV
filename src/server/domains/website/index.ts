/**
 * Website Domain - Barrel Export
 *
 * Exports all website domain components for use throughout the application.
 */

import { WebsiteRepository } from '~/server/domains/website/website.repository'
import { WebsiteService } from '~/server/domains/website/website.service'
import { db } from '~/server/infrastructure/database'

// Create singleton instances
const websiteRepository = new WebsiteRepository(db)
export const websiteService = new WebsiteService(websiteRepository, db)

// Export types
export type {
  CreateWebsiteInput,
  UpdateCoverPhotoInput,
  UpdateRsvpEnabledInput,
  UpdateWebsiteInput,
  Website,
  WebsiteWithQuestions,
  WeddingDate,
  WeddingPageData,
} from '~/server/domains/website/website.types'

// Export validators
export {
  type AnswerToQuestion,
  createWebsiteSchema,
  type CreateWebsiteSchemaInput,
  fetchWeddingDataSchema,
  getBySubUrlSchema,
  type RsvpResponse,
  submitRsvpSchema,
  type SubmitRsvpSchemaInput,
  updateCoverPhotoSchema,
  type UpdateCoverPhotoSchemaInput,
  updateRsvpEnabledSchema,
  type UpdateRsvpEnabledSchemaInput,
  updateWebsiteSchema,
  type UpdateWebsiteSchemaInput,
} from '~/server/domains/website/website.validator'

// Export classes for testing/DI
export { WebsiteRepository } from '~/server/domains/website/website.repository'
export { WebsiteService } from '~/server/domains/website/website.service'

// Export router
export { websiteRouter } from '~/server/domains/website/website.router'
