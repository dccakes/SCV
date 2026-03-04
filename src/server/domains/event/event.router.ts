/**
 * Event Domain - Router
 *
 * tRPC router for event-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { eventService } from '~/server/domains/event'
import {
  createEventSchema,
  deleteEventSchema,
  updateCollectRsvpSchema,
  updateEventSchema,
} from '~/server/domains/event/event.validator'
import { weddingService } from '~/server/domains/wedding'

export const eventRouter = createTRPCRouter({
  /**
   * Create a new event
   * Auto-creates invitations for all existing guests
   */
  create: protectedProcedure.input(createEventSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    return eventService.createEvent(weddingId, input)
  }),

  /**
   * Get all events for the current user's wedding
   */
  getAllByUserId: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.userId) return undefined
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    return eventService.getWeddingEvents(weddingId)
  }),

  /**
   * Get all events for the current user's wedding with RSVP statistics
   */
  getAllByUserIdWithStats: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.userId) return undefined
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    return eventService.getWeddingEventsWithStats(weddingId)
  }),

  /**
   * Update an existing event
   */
  update: protectedProcedure.input(updateEventSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    return eventService.updateEvent(weddingId, input)
  }),

  /**
   * Update collect RSVP status for an event
   */
  updateCollectRsvp: protectedProcedure
    .input(updateCollectRsvpSchema)
    .mutation(async ({ input }) => {
      return eventService.updateCollectRsvp(input.eventId, input.collectRsvp)
    }),

  /**
   * Delete an event
   */
  delete: protectedProcedure.input(deleteEventSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    return eventService.deleteEvent(input.eventId, weddingId)
  }),
})
