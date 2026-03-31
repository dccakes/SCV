/**
 * POST /api/etta — Main Etta agent endpoint
 *
 * Accepts chat messages, validates auth (couple session or guest JWT),
 * and streams a response via the Vercel AI SDK.
 */

import { resolveEttaAuth } from '~/lib/etta/utils/auth'
import { runEttaAgent } from '~/lib/etta/agent'

export async function POST(req: Request) {
  try {
    const ettaReq = await resolveEttaAuth(req)
    const result = await runEttaAgent(ettaReq)
    return result.toTextStreamResponse()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error'
    const status =
      message === 'No active session' || message.includes('token')
        ? 401
        : message === 'No wedding found for user'
          ? 404
          : 500

    return Response.json({ error: message }, { status })
  }
}
