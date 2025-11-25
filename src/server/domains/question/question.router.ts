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

export const questionRouter = createTRPCRouter({
  /**
   * Upsert a question (create or update)
   */
  upsert: protectedProcedure.input(upsertQuestionSchema).mutation(async ({ input }) => {
    return questionService.upsertQuestion(input)
  }),

  /**
   * Delete a question
   */
  delete: protectedProcedure.input(deleteQuestionSchema).mutation(async ({ input }) => {
    return questionService.deleteQuestion(input)
  }),
})
