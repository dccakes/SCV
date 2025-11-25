/**
 * Website Domain - Barrel Export
 *
 * Exports all website domain components for use throughout the application.
 */

import { db } from '~/server/infrastructure/database'

import { WebsiteRepository } from './website.repository'
import { WebsiteService } from './website.service'

// Create singleton instances
const websiteRepository = new WebsiteRepository(db)
export const websiteService = new WebsiteService(websiteRepository, db)

// Export types
export type {
  Website,
  WebsiteWithQuestions,
  CreateWebsiteInput,
  UpdateWebsiteInput,
  UpdateRsvpEnabledInput,
  UpdateCoverPhotoInput,
  WeddingDate,
  WeddingPageData,
} from './website.types'

// Export validators
export {
  createWebsiteSchema,
  updateWebsiteSchema,
  updateRsvpEnabledSchema,
  updateCoverPhotoSchema,
  getBySubUrlSchema,
  fetchWeddingDataSchema,
  submitRsvpSchema,
  type CreateWebsiteSchemaInput,
  type UpdateWebsiteSchemaInput,
  type UpdateRsvpEnabledSchemaInput,
  type UpdateCoverPhotoSchemaInput,
  type SubmitRsvpSchemaInput,
  type RsvpResponse,
  type AnswerToQuestion,
} from './website.validator'

// Export classes for testing/DI
export { WebsiteRepository } from './website.repository'
export { WebsiteService } from './website.service'

// Export router
export { websiteRouter } from './website.router'
