import type { Prisma } from '@prisma/client'
import { tool, zodSchema } from 'ai'
import { z } from 'zod'

import {
  ETTA_SUGGESTION_ACTION_TYPES,
  ETTA_SUGGESTION_DOMAINS,
  type EttaContext,
} from '~/lib/etta/types'
import { requireEttaPermission } from '~/lib/etta/utils/authorization'
import { db } from '~/server/db'

const suggestionActionTypeSchema = z.enum(ETTA_SUGGESTION_ACTION_TYPES)
const suggestionDomainSchema = z.enum(ETTA_SUGGESTION_DOMAINS)

export function getSuggestionTools(ctx: EttaContext) {
  return {
    get_pending_suggestions: tool({
      description: 'Lists pending suggestions awaiting review',
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        requireEttaPermission(ctx, { wedding: ['read'] })
        return db.ettaSuggestion.findMany({
          where: { weddingId: ctx.weddingId, status: 'pending' },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            summary: true,
            tier: true,
            domain: true,
            actionType: true,
            status: true,
            executedAt: true,
            failureReason: true,
            createdAt: true,
          },
        })
      },
    }),

    create_suggestion: tool({
      description: `Creates a new T1/T2 suggestion for couple review. Valid domains: ${ETTA_SUGGESTION_DOMAINS.join(', ')}. Valid action types: ${ETTA_SUGGESTION_ACTION_TYPES.join(', ')}.`,
      inputSchema: zodSchema(
        z.object({
          domain: suggestionDomainSchema,
          actionType: suggestionActionTypeSchema,
          tier: z.enum(['T1', 'T2']),
          summary: z.string(),
          payload: z.record(z.string(), z.unknown()),
        })
      ),
      execute: async ({ domain, actionType, tier, summary, payload }) => {
        requireEttaPermission(ctx, { wedding: ['update'] })
        const suggestion = await db.ettaSuggestion.create({
          data: {
            weddingId: ctx.weddingId,
            actorId: ctx.ettaActorId,
            domain,
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
