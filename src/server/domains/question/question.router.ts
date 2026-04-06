/**
 * Question Domain - Router
 *
 * tRPC router for question-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'

import { questionService } from '~/server/domains/question'
import {
  deleteQuestionSchema,
  upsertQuestionSchema,
} from '~/server/domains/question/question.validator'

export const questionRouter = createTRPCRouter({
  /**
   * Upsert a question (create or update)
   */
  upsert: protectedProcedure.input(upsertQuestionSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)

    return questionService.upsertQuestion({
      ctx: ctx.authz,
      weddingId,
      organizationId: ctx.auth.activeOrganization?.organizationId ?? null,
      data: input,
    })
  }),

  /**
   * Delete a question
   */
  delete: protectedProcedure.input(deleteQuestionSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)

    return questionService.deleteQuestion({
      ctx: ctx.authz,
      weddingId,
      organizationId: ctx.auth.activeOrganization?.organizationId ?? null,
      data: input,
    })
  }),
})
