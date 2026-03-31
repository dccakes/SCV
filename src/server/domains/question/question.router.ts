/**
 * Question Domain - Router
 *
 * tRPC router for question-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'

import { questionService } from '~/server/domains/question'
import {
  deleteQuestionSchema,
  upsertQuestionSchema,
} from '~/server/domains/question/question.validator'
import { weddingService } from '~/server/domains/wedding'

export const questionRouter = createTRPCRouter({
  /**
   * Upsert a question (create or update)
   */
  upsert: protectedProcedure.input(upsertQuestionSchema).mutation(async ({ ctx, input }) => {
    const wedding = await weddingService.getScopedWeddingByUserId(
      ctx.auth.userId,
      ctx.auth.activeOrganization?.organizationId ?? null
    )

    return questionService.upsertQuestion({
      ctx: ctx.authz,
      weddingId: wedding.id,
      organizationId: wedding.organizationId,
      data: input,
    })
  }),

  /**
   * Delete a question
   */
  delete: protectedProcedure.input(deleteQuestionSchema).mutation(async ({ ctx, input }) => {
    const wedding = await weddingService.getScopedWeddingByUserId(
      ctx.auth.userId,
      ctx.auth.activeOrganization?.organizationId ?? null
    )

    return questionService.deleteQuestion({
      ctx: ctx.authz,
      weddingId: wedding.id,
      organizationId: wedding.organizationId,
      data: input,
    })
  }),
})
