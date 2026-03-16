/**
 * Guest Tag Domain - Router
 *
 * tRPC router for guest tag-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import type { AuthzContext } from '~/server/authz/authorization.types'
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

export const guestTagRouter = createTRPCRouter({
  /**
   * Create a new guest tag
   */
  create: protectedProcedure.input(createGuestTagSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(
      ctx.auth.userId,
      ctx.auth.sessionActiveOrganizationId
    )
    return guestTagService.create(toAuthzContext(ctx), {
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
      ctx.auth.sessionActiveOrganizationId
    )
    return guestTagService.getByWeddingId(toAuthzContext(ctx), weddingId)
  }),

  /**
   * Get guest tag by ID with guest count
   */
  getById: protectedProcedure.input(guestTagIdSchema).query(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(
      ctx.auth.userId,
      ctx.auth.sessionActiveOrganizationId
    )
    return guestTagService.getByIdWithCount(toAuthzContext(ctx), input, weddingId)
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
        ctx.auth.sessionActiveOrganizationId
      )
      return guestTagService.update(toAuthzContext(ctx), input.id, weddingId, input.data)
    }),

  /**
   * Delete a guest tag
   */
  delete: protectedProcedure.input(guestTagIdSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(
      ctx.auth.userId,
      ctx.auth.sessionActiveOrganizationId
    )
    return guestTagService.delete(toAuthzContext(ctx), input, weddingId)
  }),
})
