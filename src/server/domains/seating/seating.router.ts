/**
 * Seating Domain - Router
 *
 * tRPC router for the seating chart builder. Thin layer: validates input and
 * delegates to the service.
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import { seatingService } from '~/server/domains/seating'
import {
  assignGuestsSchema,
  createSeatingTableSchema,
  seatingEventIdSchema,
  seatingTableIdSchema,
  unassignGuestsSchema,
  updateSeatingTableSchema,
} from '~/server/domains/seating/seating.validator'

export const seatingRouter = createTRPCRouter({
  getChart: protectedProcedure.input(seatingEventIdSchema).query(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return seatingService.getChart(ctx.authz, weddingId, input.eventId)
  }),

  createTable: protectedProcedure
    .input(createSeatingTableSchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      return seatingService.createTable(ctx.authz, weddingId, input)
    }),

  updateTable: protectedProcedure
    .input(updateSeatingTableSchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      return seatingService.updateTable(ctx.authz, weddingId, input.id, input.data)
    }),

  deleteTable: protectedProcedure.input(seatingTableIdSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return seatingService.deleteTable(ctx.authz, weddingId, input.id)
  }),

  assignGuests: protectedProcedure.input(assignGuestsSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return seatingService.assignGuests(ctx.authz, weddingId, input)
  }),

  unassignGuests: protectedProcedure
    .input(unassignGuestsSchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      return seatingService.unassignGuests(ctx.authz, weddingId, input)
    }),
})
