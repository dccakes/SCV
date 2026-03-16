/**
 * Vendor Domain - Router
 *
 * tRPC router for vendor-related endpoints.
 * All endpoints are protected — vendor data is private to the couple.
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import type { AuthzContext } from '~/server/authz/authorization.types'
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

const toAuthzContext = (ctx: {
  auth: {
    userId: string
    sessionActiveOrganizationId: string | null
  }
  headers: Headers
}): AuthzContext => ({
  userId: ctx.auth.userId,
  headers: ctx.headers,
  sessionActiveOrganizationId: ctx.auth.sessionActiveOrganizationId,
})

export const vendorRouter = createTRPCRouter({
  /**
   * Get all vendors for the current user's wedding, optionally filtered by category.
   * Uses a single JOIN query to avoid a separate weddingId lookup.
   */
  getAll: protectedProcedure.input(getVendorsByCategorySchema).query(async ({ ctx, input }) => {
    return vendorService.getVendorsByUserId(toAuthzContext(ctx), ctx.auth.userId, input.category)
  }),

  /**
   * Get a single vendor with all its quotes
   */
  getById: protectedProcedure.input(getVendorSchema).query(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    return vendorService.getVendorWithQuotes(toAuthzContext(ctx), input.vendorId, weddingId)
  }),

  /**
   * Create a new vendor
   */
  create: protectedProcedure.input(createVendorSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    return vendorService.createVendor(toAuthzContext(ctx), weddingId, input)
  }),

  /**
   * Update vendor details (name, location, contact, social links)
   */
  update: protectedProcedure.input(updateVendorSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    return vendorService.updateVendor(toAuthzContext(ctx), input.vendorId, weddingId, input)
  }),

  /**
   * Update vendor status (lifecycle progression)
   */
  updateStatus: protectedProcedure
    .input(updateVendorStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
      return vendorService.updateStatus(
        toAuthzContext(ctx),
        input.vendorId,
        weddingId,
        input.status
      )
    }),

  /**
   * Delete a vendor (and all its quotes)
   */
  delete: protectedProcedure.input(deleteVendorSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    return vendorService.deleteVendor(toAuthzContext(ctx), input.vendorId, weddingId)
  }),

  /**
   * Add a quote to a vendor
   */
  addQuote: protectedProcedure.input(createQuoteSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    return vendorService.addQuote(toAuthzContext(ctx), input.vendorId, weddingId, input)
  }),

  /**
   * Update an existing quote
   */
  updateQuote: protectedProcedure.input(updateQuoteSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    return vendorService.updateQuote(
      toAuthzContext(ctx),
      input.quoteId,
      input.vendorId,
      weddingId,
      input
    )
  }),

  /**
   * Delete a quote
   */
  deleteQuote: protectedProcedure.input(deleteQuoteSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    return vendorService.deleteQuote(toAuthzContext(ctx), input.quoteId, input.vendorId, weddingId)
  }),

  /**
   * Save uploaded file metadata for a quote
   */
  saveQuoteFiles: protectedProcedure
    .input(saveQuoteFilesSchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
      return vendorService.saveQuoteFiles(toAuthzContext(ctx), input.vendorId, weddingId, input)
    }),

  /**
   * Delete a file from a quote
   */
  deleteQuoteFile: protectedProcedure
    .input(deleteQuoteFileSchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
      return vendorService.deleteQuoteFile(toAuthzContext(ctx), input.vendorId, weddingId, input)
    }),
})
