/**
 * Etta Agent — Core streamText() orchestrator
 *
 * Entry point for all Etta conversations. Resolves context,
 * selects persona tools, builds the system prompt, and streams
 * a response via the Vercel AI SDK.
 *
 * Model is configurable via ETTA_MODEL env var (defaults to anthropic:claude-haiku-4-5-20251001).
 * Supports any provider registered in the provider registry (anthropic, openai, etc.).
 */

import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { createProviderRegistry, stepCountIs, streamText } from 'ai'
import { getConciergeTools } from '~/lib/etta/personas/concierge'
import { getPlannerTools } from '~/lib/etta/personas/planner'
import type { EttaRequest } from '~/lib/etta/types'
import { logAudit } from '~/lib/etta/utils/audit'
import { buildSystemPrompt } from '~/lib/etta/utils/build-system-prompt'
import { resolveEttaContext } from '~/lib/etta/utils/resolve-context'

const registry = createProviderRegistry({
  anthropic,
  openai,
})

const DEFAULT_MODEL = 'anthropic:claude-haiku-4-5-20251001'

function getModel() {
  const modelId = process.env.ETTA_MODEL || DEFAULT_MODEL
  // The registry accepts `provider:model` strings — cast to satisfy the typed overload
  return registry.languageModel(modelId as Parameters<typeof registry.languageModel>[0])
}

export async function runEttaAgent(req: EttaRequest) {
  const { actor, weddingId, guestId, messages } = req

  const ctx = await resolveEttaContext({ actor, weddingId, guestId })

  const tools = actor === 'couple' ? getPlannerTools(ctx) : getConciergeTools(ctx)
  const system = buildSystemPrompt(ctx)
  const model = getModel()

  // Enable extended thinking for Anthropic models
  const isAnthropic = (process.env.ETTA_MODEL || DEFAULT_MODEL).startsWith('anthropic:')
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
