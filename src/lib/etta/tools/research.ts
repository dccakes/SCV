import { anthropic } from '@ai-sdk/anthropic'

export function getResearchTools() {
  return {
    web_search: anthropic.tools.webSearch_20250305({}),
  }
}
