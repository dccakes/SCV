import { TRPCError } from '@trpc/server'

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import { requirePermission } from '~/server/authz/permission-checker'
import { websiteService } from '~/server/domains/website'
import { websiteSectionService } from '~/server/domains/website-section'
import { updateHomeSectionSchema } from '~/server/domains/website-section/website-section.validator'

export const websiteSectionRouter = createTRPCRouter({
  getHomeSection: protectedProcedure.query(async ({ ctx }) => {
    requirePermission(ctx.authz, { website: ['read'] })

    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    const website = await websiteService.getByWeddingId(weddingId)

    if (!website) {
      return null
    }

    return websiteSectionService.getHomeSection(website.id)
  }),

  updateHomeSection: protectedProcedure
    .input(updateHomeSectionSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx.authz, { website: ['update'] })

      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      const website = await websiteService.getByWeddingId(weddingId)

      if (!website) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Website not found',
        })
      }

      return websiteSectionService.updateHomeSection(website.id, input)
    }),
})
