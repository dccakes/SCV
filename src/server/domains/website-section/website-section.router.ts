import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { websiteManagementService } from '~/server/application/website-management'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import { updateHomeSectionSchema } from '~/server/domains/website-section/website-section.validator'

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
})
