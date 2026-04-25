import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import { ettaSuggestionService } from '~/server/domains/etta-suggestion/etta-suggestion.service'
import {
  getAllSuggestionsSchema,
  getPendingByDomainSchema,
} from '~/server/domains/etta-suggestion/etta-suggestion.validator'

export const ettaSuggestionRouter = createTRPCRouter({
  getPendingByDomain: protectedProcedure
    .input(getPendingByDomainSchema)
    .query(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      return ettaSuggestionService.getPendingByDomain({
        authz: ctx.authz,
        weddingId,
        domain: input.domain,
      })
    }),

  getPendingCounts: protectedProcedure.query(async ({ ctx }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return ettaSuggestionService.getPendingCounts({
      authz: ctx.authz,
      weddingId,
    })
  }),

  getAll: protectedProcedure.input(getAllSuggestionsSchema).query(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return ettaSuggestionService.getAll({
      authz: ctx.authz,
      weddingId,
      status: input.status,
    })
  }),
})
