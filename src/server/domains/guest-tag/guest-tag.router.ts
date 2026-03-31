/**
 * Guest Tag Domain - Router
 *
 * tRPC router for guest tag-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { guestTagService } from '~/server/domains/guest-tag'
import {
  createGuestTagSchema,
  guestTagIdSchema,
  updateGuestTagSchema,
} from '~/server/domains/guest-tag/guest-tag.validator'
import { weddingService } from '~/server/domains/wedding'

export const guestTagRouter = createTRPCRouter({
  /**
   * Create a new guest tag
   */
  create: protectedProcedure.input(createGuestTagSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(
      ctx.auth.userId,
      ctx.auth.activeOrganization?.organizationId ?? null
    )
    return guestTagService.create(ctx.authz, {
      ...input,
      weddingId,
    })
  }),

  /**
   * Get all guest tags for the current user's wedding
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(
      ctx.auth.userId,
      ctx.auth.activeOrganization?.organizationId ?? null
    )
    return guestTagService.getByWeddingId(ctx.authz, weddingId)
  }),

  /**
   * Get guest tag by ID with guest count
   */
  getById: protectedProcedure.input(guestTagIdSchema).query(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(
      ctx.auth.userId,
      ctx.auth.activeOrganization?.organizationId ?? null
    )
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
      const weddingId = await weddingService.getWeddingIdByUserId(
        ctx.auth.userId,
        ctx.auth.activeOrganization?.organizationId ?? null
      )
      return guestTagService.update(ctx.authz, input.id, weddingId, input.data)
    }),

  /**
   * Delete a guest tag
   */
  delete: protectedProcedure.input(guestTagIdSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(
      ctx.auth.userId,
      ctx.auth.activeOrganization?.organizationId ?? null
    )
    return guestTagService.delete(ctx.authz, input, weddingId)
  }),
})
