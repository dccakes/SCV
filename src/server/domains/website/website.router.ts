/**
 * Website Domain - Router
 *
 * tRPC router for website-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'

import {
  createWebsiteSchema,
  updateWebsiteSchema,
  updateRsvpEnabledSchema,
  updateCoverPhotoSchema,
  getBySubUrlSchema,
  fetchWeddingDataSchema,
  submitRsvpSchema,
} from './website.validator'
import { websiteService } from './index'

export const websiteRouter = createTRPCRouter({
  /**
   * Create a new website (initial setup)
   * Creates website, user profile, and default event
   */
  create: protectedProcedure.input(createWebsiteSchema).mutation(async ({ ctx, input }) => {
    return websiteService.createWebsite(ctx.auth.userId, {
      userId: ctx.auth.userId,
      ...input,
    })
  }),

  /**
   * Update website settings
   */
  update: protectedProcedure.input(updateWebsiteSchema).mutation(async ({ ctx, input }) => {
    return websiteService.updateWebsite(ctx.auth.userId, input)
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
  updateCoverPhoto: protectedProcedure.input(updateCoverPhotoSchema).mutation(async ({ input }) => {
    return websiteService.updateCoverPhoto(input.userId ?? '', input.coverPhotoUrl)
  }),

  /**
   * Get website for current user
   */
  getByUserId: publicProcedure.query(async ({ ctx }) => {
    return websiteService.getByUserId(ctx.auth?.userId ?? null)
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
