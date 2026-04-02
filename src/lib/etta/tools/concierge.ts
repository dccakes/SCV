import { tool, zodSchema } from 'ai'
import { z } from 'zod'

import type { EttaContext } from '~/lib/etta/types'
import { db } from '~/server/db'

export function getConciergeTools(ctx: EttaContext) {
  return {
    get_public_info: tool({
      description: 'Returns public wedding info visible to guests',
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        const events = await db.event.findMany({
          where: { weddingId: ctx.weddingId },
          select: { name: true, date: true, startTime: true, venue: true },
        })
        return { couple: ctx.wedding, events }
      },
    }),

    get_faq: tool({
      description: 'Returns published FAQs for the wedding',
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        return db.faq.findMany({
          where: { weddingId: ctx.weddingId, published: true },
          select: { question: true, answer: true },
        })
      },
    }),

    submit_rsvp: tool({
      description: 'Submits RSVP for the current guest',
      inputSchema: zodSchema(
        z.object({
          eventId: z.string(),
          rsvp: z.enum(['Attending', 'Declined']),
        })
      ),
      execute: async ({ eventId, rsvp }) => {
        if (!ctx.guestId) {
          throw new Error('Guest context required')
        }
        // Guest RSVP bypasses AuthzContext — authenticated via JWT token
        await db.invitation.updateMany({
          where: { guestId: ctx.guestId, eventId },
          data: { rsvp },
        })
        return { message: 'RSVP submitted successfully' }
      },
    }),

    flag_question: tool({
      description: 'Flags a question for the couple to answer',
      inputSchema: zodSchema(
        z.object({
          question: z.string(),
          context: z.string().optional(),
        })
      ),
      execute: async ({ question, context }) => {
        if (!ctx.guestId) {
          throw new Error('Guest context required')
        }
        await db.guestQuestion.create({
          data: {
            weddingId: ctx.weddingId,
            guestId: ctx.guestId,
            question,
            context,
          },
        })
        return { message: 'Question flagged for the couple to answer' }
      },
    }),
  }
}
