/**
 * Etta Agent — Core streamText() orchestrator
 *
 * Uses the Vercel AI Gateway to route to any supported model provider.
 * Configure via ETTA_MODEL env var (e.g. "anthropic/claude-haiku-4.5").
 */

import { gateway } from '@ai-sdk/gateway'
import { stepCountIs, streamText } from 'ai'
import { getConciergeTools } from '~/lib/etta/personas/concierge'
import { getPlannerTools } from '~/lib/etta/personas/planner'
import type { EttaRequest } from '~/lib/etta/types'
import { logAudit } from '~/lib/etta/utils/audit'
import { buildSystemPrompt } from '~/lib/etta/utils/build-system-prompt'
import { resolveEttaContext } from '~/lib/etta/utils/resolve-context'

const DEFAULT_MODEL = 'anthropic/claude-haiku-4.5'

export async function runEttaAgent(req: EttaRequest) {
  const { actor, weddingId, guestId, messages } = req

  const ctx = await resolveEttaContext({ actor, weddingId, guestId })

  const tools = actor === 'couple' ? getPlannerTools(ctx) : getConciergeTools(ctx)
  const system = buildSystemPrompt(ctx)

  const modelId = process.env.ETTA_MODEL || DEFAULT_MODEL
  const model = gateway(modelId)

  // Enable extended thinking for Anthropic models
  const isAnthropic = modelId.startsWith('anthropic/')
  const providerOptions = isAnthropic
    ? { anthropic: { thinking: { type: 'enabled' as const, budgetTokens: 5000 } } }
    : undefined

  const result = streamText({
    model,
    system,
    messages,
    tools,
    stopWhen: stepCountIs(10),
    providerOptions,
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
