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
// Export types
export type {
  Vendor,
  VendorCategory,
  VendorQuote,
  VendorStatus,
  VendorWithQuotes,
} from '~/server/domains/vendor/vendor.types'
// Export validators
export {
  type CreateQuoteInput,
  type CreateVendorInput,
  createQuoteSchema,
  createVendorSchema,
  type DeleteQuoteInput,
  type DeleteVendorInput,
  deleteQuoteSchema,
  deleteVendorSchema,
  type GetVendorsByCategoryInput,
  getVendorSchema,
  getVendorsByCategorySchema,
  type UpdateQuoteInput,
  type UpdateVendorInput,
  type UpdateVendorStatusInput,
  updateQuoteSchema,
  updateVendorSchema,
  updateVendorStatusSchema,
} from '~/server/domains/vendor/vendor.validator'
