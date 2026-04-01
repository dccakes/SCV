import { tool, zodSchema } from 'ai'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'

import type { EttaContext } from '~/lib/etta/types'
import { db } from '~/server/db'

export function getSuggestionTools(ctx: EttaContext) {
  return {
    get_pending_suggestions: tool({
      description: 'Lists pending suggestions awaiting review',
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        return db.ettaSuggestion.findMany({
          where: { weddingId: ctx.weddingId, status: 'pending' },
          orderBy: { createdAt: 'desc' },
          select: { id: true, summary: true, tier: true, actionType: true, createdAt: true },
        })
      },
    }),

    create_suggestion: tool({
      description: 'Creates a new T1/T2 suggestion for couple review',
      inputSchema: zodSchema(z.object({
        actionType: z.string(),
        tier: z.enum(['T1', 'T2']),
        summary: z.string(),
        payload: z.record(z.string(), z.unknown()),
      })),
      execute: async ({ actionType, tier, summary, payload }) => {
        const suggestion = await db.ettaSuggestion.create({
          data: {
            weddingId: ctx.weddingId,
            actorId: ctx.ettaActorId,
            actionType,
            tier,
            summary,
            payload: payload as Prisma.InputJsonValue,
            status: 'pending',
          },
        })
        return {
          suggestionId: suggestion.id,
          status: 'pending',
          message: 'Suggestion created for review',
        }
      },
    }),
  }
}
