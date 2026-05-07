/**
 * Etta Agent — Core streamText() orchestrator
 *
 * Uses the Vercel AI Gateway to route to any supported model provider.
 * Configure via ETTA_MODEL env var (e.g. "anthropic/claude-haiku-4.5").
 *
 * Authorization and attribution contract (must remain true):
 * 1) Permission checks execute as the acting signed-in user (ctx.authz/role-based authz).
 * 2) Audit attribution for tool execution is recorded as actorType='etta' with ettaActorId.
 *
 * This distinction is intentional: Etta can only do what the user is allowed to do, while
 * still preserving an agent-specific audit trail for observability and governance.
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

const ADAPTIVE_MODELS = ['anthropic/claude-opus-4.6', 'anthropic/claude-sonnet-4.6']

function assertEttaRuntimeConfig() {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error('Etta is not configured: AI_GATEWAY_API_KEY is missing')
  }
}

function getAnthropicThinkingOptions(modelId: string) {
  if (!modelId.startsWith('anthropic/')) return undefined

  if (ADAPTIVE_MODELS.some((m) => modelId.startsWith(m))) {
    return {
      anthropic: {
        thinking: { type: 'adaptive' as const },
      },
    }
  }

  return {
    anthropic: {
      thinking: { type: 'enabled' as const, budgetTokens: 5000 },
    },
  }
}

const MEMORY_TOOL_NAMES = ['memory_read', 'memory_write'] as const

export async function runEttaAgent(req: EttaRequest) {
  assertEttaRuntimeConfig()

  const { actor, weddingId, guestId, authz, messages, toolsetMode = 'full' } = req
  const startTime = Date.now()

  const ctx = await resolveEttaContext({ actor, weddingId, guestId, authz })

  const fullTools = actor !== 'guest' ? getPlannerTools(ctx) : getConciergeTools(ctx)
  const tools =
    toolsetMode === 'memory-only'
      ? Object.fromEntries(
          Object.entries(fullTools).filter(([name]) =>
            (MEMORY_TOOL_NAMES as readonly string[]).includes(name)
          )
        )
      : fullTools
  const system = buildSystemPrompt(ctx, { toolsetMode })

  const modelId = process.env.ETTA_MODEL || DEFAULT_MODEL
  const model = gateway(modelId)
  const providerOptions = getAnthropicThinkingOptions(modelId)

  // Log inbound request
  const userMessage = messages.at(-1)
  const chatRequestActorId =
    actor === 'guest'
      ? (authz?.userId ?? `guest:${guestId}`)
      : actor === 'couple-bot'
        ? (authz?.userId ?? 'couple-bot:unknown')
        : (authz?.userId ?? 'couple:unknown')
  await logAudit({
    weddingId,
    actorId: chatRequestActorId,
    actorType: actor === 'guest' ? 'guest' : actor === 'couple-bot' ? 'couple-bot' : 'couple',
    action: 'chat_request',
    resourceType: 'conversation',
    payload: {
      model: modelId,
      persona: actor,
      messageCount: messages.length,
      latestMessage:
        userMessage && 'content' in userMessage
          ? String(userMessage.content).slice(0, 500)
          : undefined,
    },
  })

  let stepCount = 0

  const result = streamText({
    model,
    system,
    messages,
    tools,
    stopWhen: stepCountIs(10),
    providerOptions,
    onStepFinish: async ({ text, toolCalls, toolResults, usage, reasoning }) => {
      stepCount++

      // Log tool invocations
      const results = toolResults ?? []
      if (results.length > 0) {
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
      }

      // Log step completion with usage
      await logAudit({
        weddingId,
        actorId: ctx.ettaActorId,
        actorType: 'etta',
        action: 'step_complete',
        resourceType: 'conversation',
        payload: {
          step: stepCount,
          hasText: !!text,
          textLength: text?.length ?? 0,
          toolCallCount: toolCalls?.length ?? 0,
          toolNames: toolCalls?.map((tc) => tc.toolName) ?? [],
          hasReasoning: !!reasoning,
          usage: usage
            ? {
                inputTokens: usage.inputTokens,
                outputTokens: usage.outputTokens,
                totalTokens: usage.totalTokens,
              }
            : undefined,
        },
      })
    },
    onFinish: async ({ text, usage, steps }) => {
      const durationMs = Date.now() - startTime

      await logAudit({
        weddingId,
        actorId: ctx.ettaActorId,
        actorType: 'etta',
        action: 'chat_response',
        resourceType: 'conversation',
        payload: {
          model: modelId,
          persona: actor,
          durationMs,
          responseLength: text?.length ?? 0,
          totalSteps: steps?.length ?? stepCount,
          usage: usage
            ? {
                inputTokens: usage.inputTokens,
                outputTokens: usage.outputTokens,
                totalTokens: usage.totalTokens,
              }
            : undefined,
        },
      })
    },
  })

  return result
}
