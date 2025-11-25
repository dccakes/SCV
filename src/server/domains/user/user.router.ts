/**
 * User Domain - Router
 *
 * tRPC router for user-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'

import { updateUserSchema } from './user.validator'
import { userService } from './index'

export const userRouter = createTRPCRouter({
  /**
   * Get the current authenticated user
   * Public procedure that returns null if not authenticated
   */
  get: publicProcedure.query(async ({ ctx }) => {
    return userService.getCurrentUser(ctx.auth.userId)
  }),

  /**
   * Get the current user's profile (requires authentication)
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return userService.getById(ctx.auth.userId, ctx.auth.userId)
  }),

  /**
   * Update the current user's profile
   */
  updateProfile: protectedProcedure.input(updateUserSchema).mutation(async ({ ctx, input }) => {
    return userService.updateProfile(ctx.auth.userId, ctx.auth.userId, input)
  }),
})
