import { runEttaAgent } from '~/lib/etta/agent'
import { ETTA_SUGGESTION_ACTION_TYPES } from '~/lib/etta/types'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { db } from '~/server/db'

export const ETTA_EXECUTION_FAILURE_MESSAGE =
  'Etta could not complete this suggestion. Review it and try again.'

type ApprovedSuggestionSnapshot = {
  id: string
  weddingId: string
  status: string
  summary: string
  actionType: string
  domain?: string | null
  payload: unknown
}

type RunApprovedSuggestionParams = {
  suggestion: ApprovedSuggestionSnapshot
  authz: AuthzContext
}

export async function runApprovedSuggestion(params: RunApprovedSuggestionParams): Promise<void> {
  const { suggestion, authz } = params
  const { id: suggestionId, weddingId } = suggestion

  if (suggestion.status !== 'approved') {
    return
  }

  try {
    // TODO(review-security): replace prompt-driven execution with typed action handlers per actionType.
    const result = await runEttaAgent({
      actor: 'couple-background',
      weddingId,
      authz,
      toolsetMode: 'background-execution',
      approvedSuggestionActionType: ETTA_SUGGESTION_ACTION_TYPES.includes(
        suggestion.actionType as (typeof ETTA_SUGGESTION_ACTION_TYPES)[number]
      )
        ? (suggestion.actionType as (typeof ETTA_SUGGESTION_ACTION_TYPES)[number])
        : 'other',
      messages: [
        {
          role: 'user',
          content: [
            `Execute approved suggestion ${suggestion.id}: ${suggestion.summary}.`,
            `Action type: ${suggestion.actionType}.`,
            `Domain: ${String((suggestion as { domain?: unknown }).domain ?? 'other')}.`,
            `Payload: ${JSON.stringify(suggestion.payload)}.`,
            'Use your tools to carry out the action. Do not ask the user for more input.',
          ].join(' '),
        },
      ],
    })

    const [text, steps] = await Promise.all([result.text, result.steps])
    const executedToolCount = steps.reduce((count, step) => count + step.toolResults.length, 0)

    if (executedToolCount === 0) {
      throw new Error(
        `No execution-safe tool was used for approved suggestion ${suggestionId}: ${text}`
      )
    }

    await db.ettaSuggestion.updateMany({
      where: { id: suggestionId, status: 'approved' },
      data: {
        status: 'actioned',
        executedAt: new Date(),
        failureReason: null,
      },
    })
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: background execution failures remain server-side
    console.error('[Etta] Suggestion execution failed:', {
      suggestionId,
      error,
    })

    await db.ettaSuggestion.updateMany({
      where: { id: suggestionId, status: 'approved' },
      data: {
        status: 'failed',
        failureReason: ETTA_EXECUTION_FAILURE_MESSAGE,
      },
    })
  }
}
