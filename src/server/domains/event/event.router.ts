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

export const eventRouter = createTRPCRouter({
  /**
   * Create a new event
   * Auto-creates invitations for all existing guests
   */
  create: protectedProcedure.input(createEventSchema).mutation(async ({ ctx, input }) => {
    return eventService.createEvent(ctx.auth.userId, input)
  }),

  /**
   * Get all events for the current user
   */
  getAllByUserId: publicProcedure.query(async ({ ctx }) => {
    return eventService.getUserEvents(ctx.auth.userId)
  }),

  /**
   * Update an existing event
   */
  update: protectedProcedure.input(updateEventSchema).mutation(async ({ ctx, input }) => {
    return eventService.updateEvent(ctx.auth.userId, input)
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
    return eventService.deleteEvent(input.eventId, ctx.auth.userId)
  }),
})
