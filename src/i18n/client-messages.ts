/**
 * Template copy is rendered by server components, which read messages from the
 * request config. Only the namespaces client components use are sent to the
 * browser, which keeps the long Voyage guides out of every page payload.
 */
const SERVER_ONLY_NAMESPACES = new Set(['classic', 'aurelia', 'templateShared'])
const CLIENT_VOYAGE_NAMESPACES = ['flights', 'nav', 'pages', 'stays'] as const

export function clientMessages(messages: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [namespace, value] of Object.entries(messages)) {
    if (SERVER_ONLY_NAMESPACES.has(namespace)) continue
    if (namespace === 'voyage' && typeof value === 'object' && value !== null) {
      const voyage = value as Record<string, unknown>
      result.voyage = Object.fromEntries(
        CLIENT_VOYAGE_NAMESPACES.filter((key) => key in voyage).map((key) => [key, voyage[key]])
      )
      continue
    }
    result[namespace] = value
  }
  return result
}
