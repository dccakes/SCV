/**
 * Website Domain - Router
 *
 * tRPC router for website-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { TRPCError } from '@trpc/server'

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { websiteService } from '~/server/domains/website'
import {
  createWebsiteSchema,
  fetchWeddingDataSchema,
  getBySubUrlSchema,
  submitRsvpSchema,
  updateCoverPhotoSchema,
  updateRsvpEnabledSchema,
  updateWebsiteSchema,
} from '~/server/domains/website/website.validator'
import { weddingService } from '~/server/domains/wedding'

export const websiteRouter = createTRPCRouter({
  /**
   * Enable website add-on for wedding
   * Note: Wedding must already exist before enabling website add-on
   */
  create: protectedProcedure.input(createWebsiteSchema).mutation(async ({ ctx, input }) => {
    // Get the user's wedding
    const wedding = await weddingService.getByUserId(ctx.auth.userId)
    if (!wedding) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Wedding must be created before enabling website add-on',
      })
    }

    return websiteService.enableWebsite(wedding.id, input)
  }),

  /**
   * Update website settings
   */
  update: protectedProcedure.input(updateWebsiteSchema).mutation(async ({ ctx, input }) => {
    // Get the user's wedding
    const wedding = await weddingService.getByUserId(ctx.auth.userId)
    if (!wedding) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Wedding not found',
      })
    }

    return websiteService.updateWebsite(wedding.id, input)
  }),

  /**
   * Update RSVP enabled status
   */
  updateIsRsvpEnabled: protectedProcedure
    .input(updateRsvpEnabledSchema)
    .mutation(async ({ input }) => {
      return websiteService.updateRsvpEnabled(input.websiteId, input.isRsvpEnabled)
    }),

  /**
   * Update cover photo
   */
  updateCoverPhoto: protectedProcedure
    .input(updateCoverPhotoSchema)
    .mutation(async ({ ctx, input }) => {
      // Get the user's wedding
      const wedding = await weddingService.getByUserId(ctx.auth.userId)
      if (!wedding) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Wedding not found',
        })
      }

      return websiteService.updateCoverPhoto(wedding.id, input.coverPhotoUrl)
    }),

  /**
   * Get website for current user's wedding
   */
  getByUserId: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.auth?.userId) {
      return null
    }

    // Get the user's wedding first
    const wedding = await weddingService.getByUserId(ctx.auth.userId)
    if (!wedding) {
      return null
    }

    return websiteService.getByWeddingId(wedding.id)
  }),

  /**
   * Get website by sub URL (public lookup)
   */
  getBySubUrl: publicProcedure.input(getBySubUrlSchema).query(async ({ input }) => {
    return websiteService.getBySubUrl(input.subUrl)
  }),

  /**
   * Fetch complete wedding data for public website display
   */
  fetchWeddingData: publicProcedure.input(fetchWeddingDataSchema).query(async ({ input }) => {
    return websiteService.fetchWeddingData(input.subUrl)
  }),

  /**
   * Submit RSVP form responses
   *
   * Note: This is a cross-domain operation that will be moved to an
   * RSVP Submission Application Service in Phase 4.
   */
  submitRsvpForm: protectedProcedure.input(submitRsvpSchema).mutation(async ({ input }) => {
    return websiteService.submitRsvpForm(input)
  }),
})
