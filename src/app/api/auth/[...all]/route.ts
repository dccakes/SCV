import { toNextJsHandler } from 'better-auth/next-js'

import { auth } from '~/lib/auth'
import {
  enforceRateLimit,
  getAuthRateLimitTarget,
  getClientIp,
  rateLimitedResponse,
  rateLimitHeaders,
} from '~/server/infrastructure/rate-limit'

const handlers = toNextJsHandler(auth.handler)

// GET is intentionally not rate limited: it is mostly session reads, and the GET endpoints that
// take tokens (/verify-email, /reset-password/:token) use high-entropy single-use tokens.
export const GET = handlers.GET

export async function POST(req: Request): Promise<Response> {
  const ip = getClientIp(req.headers)
  let limitHeaders: Record<string, string> = {}

  // No IP (local dev without a proxy): skip rather than share one bucket across everyone.
  if (ip) {
    const { policy, key } = getAuthRateLimitTarget(new URL(req.url).pathname)
    const result = await enforceRateLimit(policy, `${key}:${ip}`)
    if (!result.allowed) {
      return rateLimitedResponse(result)
    }
    limitHeaders = rateLimitHeaders(result)
  }

  const response = await handlers.POST(req)
  if (Object.keys(limitHeaders).length === 0) return response

  // Rebuild rather than mutate: handler responses may have immutable headers.
  const headers = new Headers(response.headers)
  for (const [name, value] of Object.entries(limitHeaders)) headers.set(name, value)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
