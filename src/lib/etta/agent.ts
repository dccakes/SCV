/**
 * Etta Agent — Core streamText() orchestrator
 *
 * Entry point for all Etta conversations. Resolves context,
 * selects persona tools, builds the system prompt, and streams
 * a response via the Vercel AI SDK + Claude.
 */

import { streamText, stepCountIs } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

import { resolveEttaContext } from '~/lib/etta/utils/resolve-context'
import { buildSystemPrompt } from '~/lib/etta/utils/build-system-prompt'
import { getPlannerTools } from '~/lib/etta/personas/planner'
import { getConciergeTools } from '~/lib/etta/personas/concierge'
import { logAudit } from '~/lib/etta/utils/audit'
import type { EttaRequest } from '~/lib/etta/types'

export async function runEttaAgent(req: EttaRequest) {
  const { actor, weddingId, guestId, messages } = req

  // Resolve context: wedding data + pgvector memory
  const ctx = await resolveEttaContext({ actor, weddingId, guestId })

  // Load tools and system prompt based on persona
  const tools =
    actor === 'couple' ? getPlannerTools(ctx) : getConciergeTools(ctx)

  const system = buildSystemPrompt(actor, ctx)

  const result = streamText({
    model: anthropic('claude-sonnet-4-5-20250514'),
    system,
    messages,
    tools,
    stopWhen: stepCountIs(10),
    onStepFinish: async ({ toolResults }) => {
      const results = toolResults ?? []
      if (results.length === 0) return
      await Promise.all(
        results.map((r) =>
          logAudit({
            weddingId,
            actorId: ctx.ettaActorId,
            actorType: 'etta',
            action: r.toolName,
            resourceType: 'tool_call',
            payload: r as Record<string, unknown>,
          })
        )
      )
    },
  })

  return result
}
