/**
 * Vendor Domain - Router
 *
 * tRPC router for vendor-related endpoints.
 * All endpoints are protected — vendor data is private to the couple.
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { gmailService } from '~/server/domains/gmail'
import { vendorService } from '~/server/domains/vendor'
import {
  createQuoteSchema,
  createVendorSchema,
  deleteQuoteFileSchema,
  deleteQuoteSchema,
  deleteVendorSchema,
  getVendorSchema,
  getVendorsByCategorySchema,
  saveQuoteFilesSchema,
  updateQuoteSchema,
  updateVendorSchema,
  updateVendorStatusSchema,
} from '~/server/domains/vendor/vendor.validator'
import { weddingService } from '~/server/domains/wedding'

export const vendorRouter = createTRPCRouter({
  /**
   * Get all vendors for the current user's wedding, optionally filtered by category.
   * Uses a single JOIN query to avoid a separate weddingId lookup.
   */
  getAll: protectedProcedure.input(getVendorsByCategorySchema).query(async ({ ctx, input }) => {
    return vendorService.getVendorsByUserId(ctx.auth.userId, input.category)
  }),

  /**
   * Get a single vendor with all its quotes
   */
  getById: protectedProcedure.input(getVendorSchema).query(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    return vendorService.getVendorWithQuotes(input.vendorId, weddingId)
  }),

  /**
   * Create a new vendor
   */
  create: protectedProcedure.input(createVendorSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    const vendor = await vendorService.createVendor(weddingId, input)

    // Background sync: fetch Gmail messages for this vendor's contact email
    if (input.contactEmail) {
      gmailService.syncForVendor(ctx.auth.userId, vendor.id).catch((err) => {
        console.error('Gmail sync failed for vendor:', vendor.id, err)
      })
    }

    return vendor
  }),

  /**
   * Update vendor details (name, location, contact, social links)
   */
  update: protectedProcedure.input(updateVendorSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    const vendor = await vendorService.updateVendor(input.vendorId, weddingId, input)

    // Background sync: if contact email was updated, re-sync for this vendor
    if (input.contactEmail) {
      gmailService.syncForVendor(ctx.auth.userId, vendor.id).catch((err) => {
        console.error('Gmail sync failed for vendor:', vendor.id, err)
      })
    }

    return vendor
  }),

  /**
   * Update vendor status (lifecycle progression)
   */
  updateStatus: protectedProcedure
    .input(updateVendorStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
      return vendorService.updateStatus(input.vendorId, weddingId, input.status)
    }),

  /**
   * Delete a vendor (and all its quotes)
   */
  delete: protectedProcedure.input(deleteVendorSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    return vendorService.deleteVendor(input.vendorId, weddingId)
  }),

  /**
   * Add a quote to a vendor
   */
  addQuote: protectedProcedure.input(createQuoteSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    return vendorService.addQuote(input.vendorId, weddingId, input)
  }),

  /**
   * Update an existing quote
   */
  updateQuote: protectedProcedure.input(updateQuoteSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    return vendorService.updateQuote(input.quoteId, input.vendorId, weddingId, input)
  }),

  /**
   * Delete a quote
   */
  deleteQuote: protectedProcedure.input(deleteQuoteSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    return vendorService.deleteQuote(input.quoteId, input.vendorId, weddingId)
  }),

  /**
   * Save uploaded file metadata for a quote
   */
  saveQuoteFiles: protectedProcedure
    .input(saveQuoteFilesSchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
      return vendorService.saveQuoteFiles(input.vendorId, weddingId, input)
    }),

  /**
   * Delete a file from a quote
   */
  deleteQuoteFile: protectedProcedure
    .input(deleteQuoteFileSchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
      return vendorService.deleteQuoteFile(input.vendorId, weddingId, input)
    }),
})
