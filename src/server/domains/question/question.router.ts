/**
 * Question Domain - Router
 *
 * tRPC router for question-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'

import type { AuthzContext } from '~/server/authz/authorization.types'
import { questionService } from '~/server/domains/question'
import {
  deleteQuestionSchema,
  upsertQuestionSchema,
} from '~/server/domains/question/question.validator'
import { weddingService } from '~/server/domains/wedding'

const toAuthzContext = (ctx: {
  auth: {
    userId: string
    sessionActiveOrganizationId: string | null
  }
  headers: Headers
}): AuthzContext => ({
  userId: ctx.auth.userId,
  headers: ctx.headers,
  sessionActiveOrganizationId: ctx.auth.sessionActiveOrganizationId,
})

export const questionRouter = createTRPCRouter({
  /**
   * Upsert a question (create or update)
   */
  upsert: protectedProcedure.input(upsertQuestionSchema).mutation(async ({ ctx, input }) => {
    const wedding = await weddingService.getByUserId(ctx.auth.userId)
    if (!wedding) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Wedding not found',
      })
    }

    return questionService.upsertQuestion({
      ctx: toAuthzContext(ctx),
      weddingId: wedding.id,
      organizationId: wedding.organizationId,
      data: input,
    })
  }),

  /**
   * Delete a question
   */
  delete: protectedProcedure.input(deleteQuestionSchema).mutation(async ({ ctx, input }) => {
    const wedding = await weddingService.getByUserId(ctx.auth.userId)
    if (!wedding) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Wedding not found',
      })
    }

    return questionService.deleteQuestion({
      ctx: toAuthzContext(ctx),
      weddingId: wedding.id,
      organizationId: wedding.organizationId,
      data: input,
    })
  }),
})
