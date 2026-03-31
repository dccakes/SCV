import { tool, zodSchema } from 'ai'
import { z } from 'zod'

import type { EttaContext } from '~/lib/etta/types'
import { db } from '~/server/db'

// Stub — full implementation requires a BudgetItem Prisma model.
// For now, budget changes are captured as T1 suggestions for couple approval.

export function getBudgetTools(ctx: EttaContext) {
  return {
    get_budget_summary: tool({
      description: 'Get budget overview for the wedding',
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        const pendingCount = await db.ettaSuggestion.count({
          where: {
            weddingId: ctx.weddingId,
            actionType: 'upsert_budget_item',
            status: 'pending',
          },
        })

        return {
          message: `Budget tracking will be available soon. You have ${pendingCount} pending suggestions.`,
        }
      },
    }),

    upsert_budget_item: tool({
      description: 'Suggest a budget item change (requires couple approval)',
      inputSchema: zodSchema(z.object({
        category: z.string(),
        description: z.string(),
        estimated: z.number(),
        actual: z.number().optional(),
      })),
      execute: async (params) => {
        const suggestion = await db.ettaSuggestion.create({
          data: {
            weddingId: ctx.weddingId,
            actorId: ctx.ettaActorId,
            actionType: 'upsert_budget_item',
            tier: 'T1',
            payload: params,
            summary: `Budget update: ${params.category} — ${params.description} ($${params.estimated})`,
            status: 'pending',
          },
        })

        return {
          status: 'pending' as const,
          message: 'Budget update suggestion created',
          suggestionId: suggestion.id,
        }
      },
    }),
  }
}
