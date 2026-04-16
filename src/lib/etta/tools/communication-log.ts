import { tool, zodSchema } from 'ai'
import { z } from 'zod'

import type { EttaContext } from '~/lib/etta/types'
import { requirePlannerAuthz } from '~/lib/etta/utils/authorization'
import { communicationLogService } from '~/server/domains/communication-log'

export function getCommunicationLogTools(ctx: EttaContext) {
  return {
    add_household_note: tool({
      description:
        "Add a note to a household's communication log to record outreach, follow-ups, or other interactions. Use this when the couple mentions contacting a guest, or when you take an action related to a household.",
      inputSchema: zodSchema(
        z.object({
          householdId: z.string().min(1),
          message: z.string().min(1).max(2000),
        })
      ),
      execute: async ({ householdId, message }) => {
        const authz = requirePlannerAuthz(ctx)
        const note = await communicationLogService.addNote(
          authz,
          ctx.weddingId,
          householdId,
          message,
          'etta'
        )
        return { noteId: note.id, message: 'Note added to communication log' }
      },
    }),

    get_household_timeline: tool({
      description:
        'Get the communication timeline for a household, including invitations sent, RSVPs received, thank-you notes, and manual notes. Use this to understand the outreach history before suggesting follow-ups.',
      inputSchema: zodSchema(
        z.object({
          householdId: z.string().min(1),
        })
      ),
      execute: async ({ householdId }) => {
        const authz = requirePlannerAuthz(ctx)
        const timeline = await communicationLogService.getTimelineForHousehold(
          authz,
          ctx.weddingId,
          householdId
        )
        return { entries: timeline, count: timeline.length }
      },
    }),
  }
}
