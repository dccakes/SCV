import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { websiteManagementService } from '~/server/application/website-management'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import {
  updateHomeSectionSchema,
  updateSectionSchema,
} from '~/server/domains/website-section/website-section.validator'

export const websiteSectionRouter = createTRPCRouter({
  getHomeSection: protectedProcedure.query(async ({ ctx }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return websiteManagementService.getHomeSection(ctx.authz, weddingId)
  }),

  updateHomeSection: protectedProcedure
    .input(updateHomeSectionSchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      return websiteManagementService.updateHomeSection(ctx.authz, weddingId, input)
    }),

  /** List all stored sections for the current wedding's website. */
  getSections: protectedProcedure.query(async ({ ctx }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return websiteManagementService.getSections(ctx.authz, weddingId)
  }),

  /** Create or update a section of any type. */
  upsertSection: protectedProcedure.input(updateSectionSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return websiteManagementService.upsertSection(ctx.authz, weddingId, {
      type: input.type,
      content: input.content,
      isEnabled: input.isEnabled,
    })
  }),
})
