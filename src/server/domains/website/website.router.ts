/**
 * Website Domain - Router
 *
 * tRPC router for website-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { rsvpSubmissionService, submitPublicRsvpSchema } from '~/server/application/rsvp-submission'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import { websiteService } from '~/server/domains/website'
import {
  createWebsiteSchema,
  fetchWeddingDataSchema,
  getBySubUrlSchema,
  hasPasswordAccessSchema,
  updateCoverPhotoSchema,
  updateRsvpEnabledSchema,
  updateWebsiteSchema,
  verifyWebsitePasswordSchema,
} from '~/server/domains/website/website.validator'
export const websiteRouter = createTRPCRouter({
  /**
   * Enable website add-on for wedding
   * Note: Wedding must already exist before enabling website add-on
   */
  create: protectedProcedure.input(createWebsiteSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)

    return websiteService.enableWebsite(ctx.authz, weddingId, input)
  }),

  /**
   * Update website settings
   */
  update: protectedProcedure.input(updateWebsiteSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)

    return websiteService.updateWebsite(ctx.authz, weddingId, input)
  }),

  /**
   * Update RSVP enabled status
   */
  updateIsRsvpEnabled: protectedProcedure
    .input(updateRsvpEnabledSchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)

      return websiteService.updateRsvpEnabled(
        ctx.authz,
        weddingId,
        input.websiteId,
        input.isRsvpEnabled
      )
    }),

  /**
   * Update cover photo
   */
  updateCoverPhoto: protectedProcedure
    .input(updateCoverPhotoSchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)

      return websiteService.updateCoverPhoto(ctx.authz, weddingId, input.coverPhotoUrl)
    }),

  /**
   * Get website for current user's wedding
   */
  getByUserId: protectedProcedure.query(async ({ ctx }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return websiteService.getByWeddingId(weddingId)
  }),

  /**
   * Get website by sub URL (public lookup)
   */
  getBySubUrl: publicProcedure.input(getBySubUrlSchema).query(async ({ input }) => {
    return websiteService.getBySubUrl(input.subUrl)
  }),

  hasPasswordAccess: publicProcedure.input(hasPasswordAccessSchema).query(async ({ input }) => {
    return websiteService.hasPasswordAccess(input.subUrl, input.accessToken)
  }),

  verifyWebsitePassword: publicProcedure
    .input(verifyWebsitePasswordSchema)
    .mutation(async ({ input }) => {
      return websiteService.verifyWebsitePassword(input.subUrl, input.password)
    }),

  /**
   * Fetch complete wedding data for public website display
   */
  fetchWeddingData: publicProcedure.input(fetchWeddingDataSchema).query(async ({ input }) => {
    return websiteService.fetchWeddingData(input.subUrl, input.accessToken)
  }),

  /**
   * Submit RSVP form responses
   *
   * Note: This is a cross-domain operation that will be moved to an
   * RSVP Submission Application Service in Phase 4.
   */
  submitPublicRsvpForm: publicProcedure
    .input(submitPublicRsvpSchema)
    .mutation(async ({ input }) => {
      return rsvpSubmissionService.submitPublicRsvp(input)
    }),
})
