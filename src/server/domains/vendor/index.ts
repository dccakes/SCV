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
  createQuoteSchema,
  type CreateQuoteInput,
  createVendorSchema,
  type CreateVendorInput,
  deleteQuoteSchema,
  type DeleteQuoteInput,
  deleteVendorSchema,
  type DeleteVendorInput,
  getVendorSchema,
  getVendorsByCategorySchema,
  type GetVendorsByCategoryInput,
  updateQuoteSchema,
  type UpdateQuoteInput,
  updateVendorSchema,
  type UpdateVendorInput,
  updateVendorStatusSchema,
  type UpdateVendorStatusInput,
} from '~/server/domains/vendor/vendor.validator'

// Export classes for testing/DI
export { VendorRepository } from '~/server/domains/vendor/vendor.repository'
export { VendorService } from '~/server/domains/vendor/vendor.service'

// Export router
export { vendorRouter } from '~/server/domains/vendor/vendor.router'
