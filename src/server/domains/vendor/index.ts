/**
 * Vendor Domain - Barrel Export
 *
 * Exports all vendor domain components for use throughout the application.
 */

import { VendorRepository } from '~/server/domains/vendor/vendor.repository'
import { VendorService } from '~/server/domains/vendor/vendor.service'
import { db } from '~/server/infrastructure/database'

// Create singleton instances
const vendorRepository = new VendorRepository(db)
export const vendorService = new VendorService(vendorRepository)

// Export classes for testing/DI
export { VendorRepository } from '~/server/domains/vendor/vendor.repository'
export { VendorService } from '~/server/domains/vendor/vendor.service'
export type {
  Vendor,
  VendorCategory,
  VendorQuote,
  VendorQuoteFile,
  VendorStatus,
  VendorWithQuotes,
} from '~/server/domains/vendor/vendor.types'
// Export types
export { QuoteType } from '~/server/domains/vendor/vendor.types'
// Export validators
export {
  type CreateQuoteInput,
  type CreateVendorInput,
  createQuoteSchema,
  createVendorSchema,
  type DeleteQuoteFileInput,
  type DeleteQuoteInput,
  type DeleteVendorInput,
  deleteQuoteFileSchema,
  deleteQuoteSchema,
  deleteVendorSchema,
  type GetVendorsByCategoryInput,
  getVendorSchema,
  getVendorsByCategorySchema,
  type SaveQuoteFilesInput,
  type SetVendorRatingInput,
  saveQuoteFilesSchema,
  setVendorRatingSchema,
  type UpdateQuoteInput,
  type UpdateVendorInput,
  type UpdateVendorStatusInput,
  updateQuoteSchema,
  updateVendorSchema,
  updateVendorStatusSchema,
} from '~/server/domains/vendor/vendor.validator'
