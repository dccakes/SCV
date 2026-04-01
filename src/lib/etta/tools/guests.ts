import { tool, zodSchema } from 'ai'
import { z } from 'zod'

import { RSVP_STATUS } from '~/lib/constants/rsvp'
import type { EttaContext } from '~/lib/etta/types'
import { guestService } from '~/server/domains/guest'
import { invitationService } from '~/server/domains/invitation'

export function getGuestTools(ctx: EttaContext) {
  return {
    get_guest_list: tool({
      description: 'Get the complete guest list for the wedding',
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        const guests = await guestService.getAllByWeddingId(ctx.weddingId)
        return { guests: guests ?? [] }
      },
    }),

    update_guest: tool({
      description: "Update a guest's information (name, email, phone)",
      inputSchema: zodSchema(
        z.object({
          guestId: z.number(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          email: z.string().nullable().optional(),
          phone: z.string().nullable().optional(),
        })
      ),
      execute: async ({ guestId, ...data }) => {
        if (!ctx.authz) throw new Error('Authorization context required')
        const guest = await guestService.updateGuest(ctx.authz, guestId, data)
        return { guest }
      },
    }),

    get_rsvp_summary: tool({
      description: 'Get RSVP statistics for the wedding',
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        const invitations = await invitationService.getAllByWeddingId(ctx.weddingId)
        const list = invitations ?? []

        const attending = list.filter((i) => i.rsvp === RSVP_STATUS.ATTENDING).length
        const declined = list.filter((i) => i.rsvp === RSVP_STATUS.DECLINED).length
        const pending = list.length - attending - declined

        return { total: list.length, attending, declined, pending }
      },
    }),
  }
}
