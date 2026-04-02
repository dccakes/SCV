import { anthropic } from '@ai-sdk/anthropic'
import { gateway } from '@ai-sdk/gateway'

const DEFAULT_MODEL = 'anthropic/claude-haiku-4.5'

/**
 * Returns web search tools appropriate for the configured model.
 * - Anthropic models: uses native Anthropic web search (richer results, source URLs)
 * - All other models: uses gateway's Parallel Search (works with any provider)
 */
export function getResearchTools() {
  const modelId = process.env.ETTA_MODEL || DEFAULT_MODEL

  if (modelId.startsWith('anthropic/')) {
    return {
      web_search: anthropic.tools.webSearch_20250305({
        maxUses: 3,
      }),
    }
  }

  return {
    web_search: gateway.tools.parallelSearch({
      mode: 'agentic',
      maxResults: 5,
    }),
  }
}
