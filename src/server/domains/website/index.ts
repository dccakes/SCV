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

// Export classes for testing/DI
export { WebsiteRepository } from '~/server/domains/website/website.repository'
// Export router
export { websiteRouter } from '~/server/domains/website/website.router'
export { WebsiteService } from '~/server/domains/website/website.service'
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
  type CreateWebsiteSchemaInput,
  createWebsiteSchema,
  fetchWeddingDataSchema,
  getBySubUrlSchema,
  type RsvpResponse,
  type SubmitRsvpSchemaInput,
  submitRsvpSchema,
  type UpdateCoverPhotoSchemaInput,
  type UpdateRsvpEnabledSchemaInput,
  type UpdateWebsiteSchemaInput,
  updateCoverPhotoSchema,
  updateRsvpEnabledSchema,
  updateWebsiteSchema,
} from '~/server/domains/website/website.validator'
