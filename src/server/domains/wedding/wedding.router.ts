/**
 * Wedding Domain - Router
 *
 * tRPC router for wedding-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { eventService } from '~/server/domains/event'
import { weddingService } from '~/server/domains/wedding'
import {
  createWeddingSchema,
  updateWeddingDetailsSchema,
  updateWeddingSchema,
} from '~/server/domains/wedding/wedding.validator'

export const weddingRouter = createTRPCRouter({
  /**
   * Create a new wedding (onboarding)
   * Creates wedding, UserWedding join entry, optional event, and updates user profile
   */
  create: protectedProcedure.input(createWeddingSchema).mutation(async ({ ctx, input }) => {
    return weddingService.createWedding(ctx.auth.userId, {
      userId: ctx.auth.userId,
      ...input,
    })
  }),

  /**
   * Update wedding settings
   */
  update: protectedProcedure.input(updateWeddingSchema).mutation(async ({ ctx, input }) => {
    const wedding = await weddingService.getScopedWeddingByUserId(
      ctx.auth.userId,
      ctx.auth.activeOrganization?.organizationId ?? null
    )

    return weddingService.updateWedding({
      ctx: ctx.authz,
      weddingId: wedding.id,
      data: input,
    })
  }),

  /**
   * Get wedding details for settings page (names + first event date/location)
   */
  getDetails: protectedProcedure.query(async ({ ctx }) => {
    const wedding = await weddingService.getByUserId(ctx.auth.userId)
    if (!wedding) {
      return null
    }
    const events = await eventService.getWeddingEvents(wedding.id)
    const primaryEvent = events?.[0]
    return {
      groomFirstName: wedding.groomFirstName,
      groomLastName: wedding.groomLastName,
      brideFirstName: wedding.brideFirstName,
      brideLastName: wedding.brideLastName,
      weddingDate: primaryEvent?.date?.toISOString() ?? undefined,
      weddingLocation: primaryEvent?.venue ?? undefined,
      primaryEventId: primaryEvent?.id ?? undefined,
    }
  }),

  /**
   * Update wedding details (names + date + location) from settings page
   */
  updateDetails: protectedProcedure
    .input(updateWeddingDetailsSchema)
    .mutation(async ({ ctx, input }) => {
      const wedding = await weddingService.getByUserId(ctx.auth.userId)
      if (!wedding) {
        throw new Error('Wedding not found')
      }

      // Update wedding names
      await weddingService.updateWedding({
        ctx: ctx.authz,
        weddingId: wedding.id,
        data: {
          groomFirstName: input.groomFirstName,
          groomLastName: input.groomLastName,
          brideFirstName: input.brideFirstName,
          brideLastName: input.brideLastName,
        },
      })

      // Update or create the primary event with date/location
      const events = await eventService.getWeddingEvents(wedding.id)
      const primaryEvent = events?.[0]

      if (primaryEvent) {
        await eventService.updateEvent(ctx.authz, wedding.id, {
          eventId: primaryEvent.id,
          eventName: primaryEvent.name,
          date: input.weddingDate,
          venue: input.weddingLocation,
          allowTagAlongs: primaryEvent.allowTagAlongs,
        })
      } else if (input.weddingDate || input.weddingLocation) {
        // No events exist yet — create the Ceremony event
        await eventService.createEvent(ctx.authz, wedding.id, {
          eventName: 'Ceremony',
          date: input.weddingDate,
          venue: input.weddingLocation,
          allowTagAlongs: false,
        })
      }

      return { success: true }
    }),

  /**
   * Get wedding for current user
   */
  getByUserId: protectedProcedure.query(async ({ ctx }) => {
    return weddingService.getByUserId(ctx.auth.userId)
  }),

  /**
   * Check if current user has a wedding
   */
  hasWedding: protectedProcedure.query(async ({ ctx }) => {
    return weddingService.hasWedding(ctx.auth.userId)
  }),
})
