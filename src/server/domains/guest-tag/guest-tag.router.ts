/**
 * Guest Tag Domain - Router
 *
 * tRPC router for guest tag-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import { guestTagService } from '~/server/domains/guest-tag'
import {
  createGuestTagSchema,
  guestTagIdSchema,
  updateGuestTagSchema,
} from '~/server/domains/guest-tag/guest-tag.validator'

export const guestTagRouter = createTRPCRouter({
  /**
   * Create a new guest tag
   */
  create: protectedProcedure.input(createGuestTagSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return guestTagService.create(ctx.authz, {
      ...input,
      weddingId,
    })
  }),

  /**
   * Get all guest tags for the current user's wedding
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return guestTagService.getByWeddingId(ctx.authz, weddingId)
  }),

  /**
   * Get guest tag by ID with guest count
   */
  getById: protectedProcedure.input(guestTagIdSchema).query(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return guestTagService.getByIdWithCount(ctx.authz, input, weddingId)
  }),

  /**
   * Update a guest tag
   */
  update: protectedProcedure
    .input(
      z.object({
        id: guestTagIdSchema,
        data: updateGuestTagSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      return guestTagService.update(ctx.authz, input.id, weddingId, input.data)
    }),

  /**
   * Delete a guest tag
   */
  delete: protectedProcedure.input(guestTagIdSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return guestTagService.delete(ctx.authz, input, weddingId)
  }),
})
