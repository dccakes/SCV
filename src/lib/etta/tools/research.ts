import { gateway } from '@ai-sdk/gateway'

export function getResearchTools() {
  return {
    web_search: gateway.tools.parallelSearch(),
  }
}
