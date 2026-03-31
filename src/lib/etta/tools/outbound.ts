import { tool, zodSchema } from 'ai'
import { z } from 'zod'

import type { EttaContext } from '~/lib/etta/types'
import { db } from '~/server/db'

export function getOutboundTools(ctx: EttaContext) {
  return {
    send_whatsapp_blast: tool({
      description: 'T2: Creates a WhatsApp blast draft requiring approval',
      inputSchema: zodSchema(z.object({
        message: z.string(),
        recipientFilter: z.string().optional(),
      })),
      execute: async ({ message, recipientFilter }) => {
        const suggestion = await db.ettaSuggestion.create({
          data: {
            weddingId: ctx.weddingId,
            actorId: ctx.ettaActorId,
            actionType: 'send_whatsapp_blast',
            tier: 'T2',
            summary: 'Send WhatsApp blast to guests',
            payload: { message, recipientFilter },
            status: 'pending',
          },
        })
        return {
          suggestionId: suggestion.id,
          status: 'pending_approval',
          message:
            'WhatsApp blast draft created. Requires your approval before sending.',
        }
      },
    }),

    draft_vendor_email: tool({
      description: 'T2: Creates a vendor email draft requiring approval',
      inputSchema: zodSchema(z.object({
        vendorId: z.string(),
        subject: z.string(),
        body: z.string(),
      })),
      execute: async ({ vendorId, subject, body }) => {
        const suggestion = await db.ettaSuggestion.create({
          data: {
            weddingId: ctx.weddingId,
            actorId: ctx.ettaActorId,
            actionType: 'draft_vendor_email',
            tier: 'T2',
            summary: `Draft email to vendor: ${subject}`,
            payload: { vendorId, subject, body },
            status: 'pending',
          },
        })
        return {
          suggestionId: suggestion.id,
          status: 'pending_approval',
          message:
            'Vendor email draft created. Requires your approval before sending.',
        }
      },
    }),
  }
}
