import { tool, zodSchema } from 'ai'
import { z } from 'zod'

import type { EttaContext } from '~/lib/etta/types'
import { requireEttaPermission } from '~/lib/etta/utils/authorization'
import { db } from '~/server/db'

export function getOutboundTools(ctx: EttaContext) {
  return {
    send_whatsapp_blast: tool({
      description:
        'T2: Drafts a WhatsApp update sent to every household on the guest list via the ' +
        "wedding's dedicated WhatsApp number (one message per household, delivered into " +
        'their conversation with Etta). Requires couple approval before sending.',
      inputSchema: zodSchema(
        z.object({
          message: z.string(),
          recipientFilter: z.string().optional(),
        })
      ),
      execute: async ({ message, recipientFilter }) => {
        requireEttaPermission(ctx, { guest_invitation: ['send'] })
        const preview = message.length > 80 ? `${message.slice(0, 80)}…` : message
        const suggestion = await db.ettaSuggestion.create({
          data: {
            weddingId: ctx.weddingId,
            actorId: ctx.ettaActorId,
            actionType: 'send_whatsapp_blast',
            tier: 'T2',
            summary: `Send WhatsApp update to all households: "${preview}"`,
            payload: { message, recipientFilter },
            status: 'pending',
          },
        })
        return {
          suggestionId: suggestion.id,
          status: 'pending_approval',
          message:
            'WhatsApp update drafted. It will be sent to every reachable household once approved.',
        }
      },
    }),

    draft_vendor_email: tool({
      description: 'T2: Creates a vendor email draft requiring approval',
      inputSchema: zodSchema(
        z.object({
          vendorId: z.string(),
          subject: z.string(),
          body: z.string(),
        })
      ),
      execute: async ({ vendorId, subject, body }) => {
        requireEttaPermission(ctx, { guest_invitation: ['send'] })
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
          message: 'Vendor email draft created. Requires your approval before sending.',
        }
      },
    }),
  }
}
