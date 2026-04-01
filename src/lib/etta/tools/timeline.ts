import { tool, zodSchema } from 'ai'
import { z } from 'zod'

import type { EttaContext } from '~/lib/etta/types'
import { logAudit } from '~/lib/etta/utils/audit'

// Stub — full implementation requires a Milestone Prisma model.
// For now, returns a default milestone list and logs completions via audit.

const DEFAULT_MILESTONES = [
  { title: 'Book venue', status: 'pending' as const },
  { title: 'Choose caterer', status: 'pending' as const },
  { title: 'Send invitations', status: 'pending' as const },
  { title: 'Book photographer', status: 'pending' as const },
  { title: 'Plan honeymoon', status: 'pending' as const },
]

export function getTimelineTools(ctx: EttaContext) {
  return {
    get_milestones: tool({
      description: 'Get wedding planning milestones',
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        return { milestones: DEFAULT_MILESTONES }
      },
    }),

    complete_milestone: tool({
      description: 'Mark a milestone as complete (auto-executed, T0)',
      inputSchema: zodSchema(z.object({
        title: z.string(),
      })),
      execute: async ({ title }) => {
        await logAudit({
          weddingId: ctx.weddingId,
          actorId: ctx.ettaActorId,
          actorType: 'etta',
          action: 'complete_milestone',
          resourceType: 'milestone',
          payload: { title },
        })

        return { message: `Milestone marked as complete: ${title}` }
      },
    }),
  }
}
