import { tool, zodSchema } from 'ai'
import { z } from 'zod'

import type { EttaContext } from '~/lib/etta/types'
import { logAudit } from '~/lib/etta/utils/audit'
import { requireEttaPermission, requirePlannerAuthz } from '~/lib/etta/utils/authorization'
import { milestoneService } from '~/server/domains/milestone'

export function getTimelineTools(ctx: EttaContext) {
  return {
    get_milestones: tool({
      description: 'Get wedding planning milestones',
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        const authz = requirePlannerAuthz(ctx)
        const milestones = await milestoneService.getEffectiveMilestones(authz, ctx.weddingId)
        return { milestones }
      },
    }),

    complete_milestone: tool({
      description: 'Mark a milestone as complete (auto-executed, T0)',
      inputSchema: zodSchema(
        z.object({
          milestoneId: z.string().min(1),
        })
      ),
      execute: async ({ milestoneId }) => {
        requireEttaPermission(ctx, { wedding: ['update'] })
        const authz = requirePlannerAuthz(ctx)
        const milestone = await milestoneService.attestMilestone(authz, milestoneId, ctx.weddingId)

        await logAudit({
          weddingId: ctx.weddingId,
          actorId: ctx.ettaActorId,
          actorType: 'etta',
          action: 'complete_milestone',
          resourceType: 'milestone',
          resourceId: milestone.id,
          payload: { milestoneId: milestone.id, title: milestone.title },
        })

        return {
          message: `Milestone marked as complete: ${milestone.title}`,
          milestone,
        }
      },
    }),
  }
}
