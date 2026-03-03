/**
 * Guest Tag Domain - Router
 *
 * tRPC router for guest tag-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { GuestTagRepository } from '~/server/domains/guest-tag/guest-tag.repository'
import { GuestTagService } from '~/server/domains/guest-tag/guest-tag.service'
import {
  createGuestTagSchema,
  guestTagIdSchema,
  updateGuestTagSchema,
} from '~/server/domains/guest-tag/guest-tag.validator'
import { weddingService } from '~/server/domains/wedding'
import { db } from '~/server/infrastructure/database/client'

const guestTagRepository = new GuestTagRepository(db)
const guestTagService = new GuestTagService(guestTagRepository)

export const guestTagRouter = createTRPCRouter({
  /**
   * Create a new guest tag
   */
  create: protectedProcedure.input(createGuestTagSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    return guestTagService.create({
      ...input,
      weddingId,
    })
  }),

  /**
   * Get all guest tags for the current user's wedding
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    return guestTagService.getByWeddingId(weddingId)
  }),

  /**
   * Get guest tag by ID with guest count
   */
  getById: protectedProcedure.input(guestTagIdSchema).query(async ({ input }) => {
    return guestTagService.getByIdWithCount(input)
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
      const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
      return guestTagService.update(input.id, weddingId, input.data)
    }),

  /**
   * Delete a guest tag
   */
  delete: protectedProcedure.input(guestTagIdSchema).mutation(async ({ input }) => {
    return guestTagService.delete(input)
  }),
})
