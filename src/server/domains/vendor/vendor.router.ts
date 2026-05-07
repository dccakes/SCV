/**
 * Vendor Domain - Router
 *
 * tRPC router for vendor-related endpoints.
 * All endpoints are protected — vendor data is private to the couple.
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { vendorInsightsService } from '~/server/application/vendor-insights'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import { vendorService } from '~/server/domains/vendor'
import {
  addVendorNoteSchema,
  createQuoteSchema,
  createVendorSchema,
  deleteQuoteFileSchema,
  deleteQuoteSchema,
  deleteVendorSchema,
  getCategoryConfigSchema,
  getNotesSchema,
  getVendorSchema,
  getVendorsByCategorySchema,
  saveQuoteFilesSchema,
  setVendorRatingSchema,
  updateQuoteSchema,
  updateVendorSchema,
  updateVendorStatusSchema,
  upsertCategoryConfigSchema,
} from '~/server/domains/vendor/vendor.validator'

export const vendorRouter = createTRPCRouter({
  /**
   * Get all vendors for the current user's wedding, optionally filtered by category.
   * Uses the request-scoped active wedding from tRPC context.
   */
  getAll: protectedProcedure.input(getVendorsByCategorySchema).query(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return vendorInsightsService.listVendors(ctx.authz, weddingId, input.category)
  }),

  /**
   * Get a single vendor with all its quotes
   */
  getById: protectedProcedure.input(getVendorSchema).query(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return vendorInsightsService.getVendor(ctx.authz, weddingId, input.vendorId)
  }),

  /**
   * Create a new vendor
   */
  create: protectedProcedure.input(createVendorSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return vendorService.createVendor(ctx.authz, weddingId, input)
  }),

  /**
   * Update vendor details (name, location, contact, social links)
   */
  update: protectedProcedure.input(updateVendorSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return vendorService.updateVendor(ctx.authz, input.vendorId, weddingId, input)
  }),

  addNote: protectedProcedure.input(addVendorNoteSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return vendorService.addVendorNote(ctx.authz, input.vendorId, weddingId, input.message)
  }),

  getNotes: protectedProcedure.input(getNotesSchema).query(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return vendorService.getNotes(ctx.authz, input.vendorId, weddingId)
  }),

  getCategoryConfig: protectedProcedure
    .input(getCategoryConfigSchema)
    .query(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      return vendorService.getCategoryConfig(ctx.authz, weddingId, input.category)
    }),

  upsertCategoryConfig: protectedProcedure
    .input(upsertCategoryConfigSchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      return vendorService.upsertCategoryConfig(
        ctx.authz,
        weddingId,
        input.category,
        input.fieldDefinitions
      )
    }),

  /**
   * Update vendor status (lifecycle progression)
   */
  updateStatus: protectedProcedure
    .input(updateVendorStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      return vendorService.updateStatus(ctx.authz, input.vendorId, weddingId, input.status)
    }),

  /**
   * Delete a vendor (and all its quotes)
   */
  delete: protectedProcedure.input(deleteVendorSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return vendorService.deleteVendor(ctx.authz, input.vendorId, weddingId)
  }),

  /**
   * Add a quote to a vendor
   */
  addQuote: protectedProcedure.input(createQuoteSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return vendorService.addQuote(ctx.authz, input.vendorId, weddingId, input)
  }),

  /**
   * Update an existing quote
   */
  updateQuote: protectedProcedure.input(updateQuoteSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return vendorService.updateQuote(ctx.authz, input.quoteId, input.vendorId, weddingId, input)
  }),

  /**
   * Delete a quote
   */
  deleteQuote: protectedProcedure.input(deleteQuoteSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return vendorService.deleteQuote(ctx.authz, input.quoteId, input.vendorId, weddingId)
  }),

  /**
   * Save uploaded file metadata for a quote
   */
  saveQuoteFiles: protectedProcedure
    .input(saveQuoteFilesSchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      return vendorService.saveQuoteFiles(ctx.authz, input.vendorId, weddingId, input)
    }),

  /**
   * Delete a file from a quote
   */
  deleteQuoteFile: protectedProcedure
    .input(deleteQuoteFileSchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      return vendorService.deleteQuoteFile(ctx.authz, input.vendorId, weddingId, input)
    }),

  setRating: protectedProcedure.input(setVendorRatingSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return vendorService.setVendorRating(ctx.authz, input.vendorId, weddingId, input.stars)
  }),
})
