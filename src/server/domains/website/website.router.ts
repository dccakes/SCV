/**
 * Website Domain - Router
 *
 * tRPC router for website-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { rsvpSubmissionService, submitPublicRsvpSchema } from '~/server/application/rsvp-submission'
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
import { weddingService } from '~/server/domains/wedding'

export const websiteRouter = createTRPCRouter({
  /**
   * Enable website add-on for wedding
   * Note: Wedding must already exist before enabling website add-on
   */
  create: protectedProcedure.input(createWebsiteSchema).mutation(async ({ ctx, input }) => {
    const wedding = await weddingService.getScopedWeddingByUserId(
      ctx.auth.userId,
      ctx.auth.activeOrganization?.organizationId ?? null
    )

    return websiteService.enableWebsite(
      ctx.authz,
      wedding.id,
      input
    )
  }),

  /**
   * Update website settings
   */
  update: protectedProcedure.input(updateWebsiteSchema).mutation(async ({ ctx, input }) => {
    const wedding = await weddingService.getScopedWeddingByUserId(
      ctx.auth.userId,
      ctx.auth.activeOrganization?.organizationId ?? null
    )

    return websiteService.updateWebsite(
      ctx.authz,
      wedding.id,
      input
    )
  }),

  /**
   * Update RSVP enabled status
   */
  updateIsRsvpEnabled: protectedProcedure
    .input(updateRsvpEnabledSchema)
    .mutation(async ({ ctx, input }) => {
      const wedding = await weddingService.getScopedWeddingByUserId(
        ctx.auth.userId,
        ctx.auth.activeOrganization?.organizationId ?? null
      )

      return websiteService.updateRsvpEnabled(
        ctx.authz,
        wedding.id,
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
      const wedding = await weddingService.getScopedWeddingByUserId(
        ctx.auth.userId,
        ctx.auth.activeOrganization?.organizationId ?? null
      )

      return websiteService.updateCoverPhoto(
        ctx.authz,
        wedding.id,
        input.coverPhotoUrl
      )
    }),

  /**
   * Get website for current user's wedding
   */
  getByUserId: protectedProcedure.query(async ({ ctx }) => {
    const wedding = await weddingService.getScopedWeddingByUserId(
      ctx.auth.userId,
      ctx.auth.activeOrganization?.organizationId ?? null
    )
    return websiteService.getByWeddingId(wedding.id)
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
