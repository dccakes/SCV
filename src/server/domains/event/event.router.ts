/**
 * Event Domain - Router
 *
 * tRPC router for event-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { eventInsightsService } from '~/server/application/event-insights'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import { eventService } from '~/server/domains/event'
import {
  createEventSchema,
  deleteEventSchema,
  updateCollectRsvpSchema,
  updateEventSchema,
} from '~/server/domains/event/event.validator'

export const eventRouter = createTRPCRouter({
  /**
   * Create a new event
   * Auto-creates invitations for all existing guests
   */
  create: protectedProcedure.input(createEventSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return eventService.createEvent(ctx.authz, weddingId, input)
  }),

  /**
   * Get all events for the current user's wedding
   */
  getAllByUserId: protectedProcedure.query(async ({ ctx }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return eventInsightsService.listEvents(ctx.authz, weddingId)
  }),

  /**
   * Get all events for the current user's wedding with RSVP statistics
   */
  getAllByUserIdWithStats: protectedProcedure.query(async ({ ctx }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return eventInsightsService.listEventsWithStats(ctx.authz, weddingId)
  }),

  /**
   * Update an existing event
   */
  update: protectedProcedure.input(updateEventSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return eventService.updateEvent(ctx.authz, weddingId, input)
  }),

  /**
   * Update collect RSVP status for an event
   */
  updateCollectRsvp: protectedProcedure
    .input(updateCollectRsvpSchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      return eventService.updateCollectRsvp(ctx.authz, weddingId, input.eventId, input.collectRsvp)
    }),

  /**
   * Delete an event
   */
  delete: protectedProcedure.input(deleteEventSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return eventService.deleteEvent(ctx.authz, weddingId, input.eventId)
  }),
})
