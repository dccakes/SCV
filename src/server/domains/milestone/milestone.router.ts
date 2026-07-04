import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import { milestoneService } from '~/server/domains/milestone'
import {
  getMilestonesSchema,
  milestoneIdSchema,
} from '~/server/domains/milestone/milestone.validator'

export const milestoneRouter = createTRPCRouter({
  getAll: protectedProcedure.input(getMilestonesSchema).query(async ({ ctx }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return milestoneService.getEffectiveMilestones(ctx.authz, weddingId)
  }),

  attest: protectedProcedure.input(milestoneIdSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return milestoneService.attestMilestone(ctx.authz, input.milestoneId, weddingId)
  }),

  dismiss: protectedProcedure.input(milestoneIdSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return milestoneService.dismissMilestone(ctx.authz, input.milestoneId, weddingId)
  }),

  clearOverride: protectedProcedure.input(milestoneIdSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return milestoneService.clearOverride(ctx.authz, input.milestoneId, weddingId)
  }),
})
