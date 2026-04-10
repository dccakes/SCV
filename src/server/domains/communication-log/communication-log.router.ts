/**
 * Communication Log Domain - Router
 *
 * tRPC router for communication log endpoints.
 * Provides unified timeline queries and manual note management.
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import { communicationLogService } from '~/server/domains/communication-log'
import {
  addNoteSchema,
  deleteNoteSchema,
  getByHouseholdIdSchema,
} from '~/server/domains/communication-log/communication-log.validator'

export const communicationLogRouter = createTRPCRouter({
  /**
   * Get the unified communication log timeline for a household
   */
  getByHouseholdId: protectedProcedure
    .input(getByHouseholdIdSchema)
    .query(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      return communicationLogService.getTimelineForHousehold(
        ctx.authz,
        weddingId,
        input.householdId
      )
    }),

  /**
   * Add a manual note to a household's communication log
   */
  addNote: protectedProcedure.input(addNoteSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return communicationLogService.addNote(ctx.authz, weddingId, input.householdId, input.message)
  }),

  /**
   * Delete a manual note from the communication log
   */
  deleteNote: protectedProcedure.input(deleteNoteSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return communicationLogService.deleteNote(ctx.authz, weddingId, input.noteId)
  }),
})
