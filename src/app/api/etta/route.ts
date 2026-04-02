/**
 * POST /api/etta — Main Etta agent endpoint
 *
 * Accepts chat messages, validates auth (couple session or guest JWT),
 * and streams a response via the Vercel AI SDK.
 */

import { runEttaAgent } from '~/lib/etta/agent'
import { logAudit } from '~/lib/etta/utils/audit'
import { resolveEttaAuth } from '~/lib/etta/utils/auth'

export async function POST(req: Request) {
  let ettaReq: Awaited<ReturnType<typeof resolveEttaAuth>> | null = null

  try {
    ettaReq = await resolveEttaAuth(req)
    const result = await runEttaAgent(ettaReq)
    return result.toUIMessageStreamResponse()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status =
      message === 'No active session' || message.includes('token')
        ? 401
        : message === 'No wedding found for user'
          ? 404
          : message.startsWith('Etta is not configured:')
            ? 503
            : 500

    if (ettaReq?.weddingId) {
      await logAudit({
        weddingId: ettaReq.weddingId,
        actorId: ettaReq?.authz?.userId ?? 'unknown',
        actorType: ettaReq.actor === 'guest' ? 'guest' : 'couple',
        action: 'chat_error',
        resourceType: 'conversation',
        payload: {
          error: message,
          status,
          stack: error instanceof Error ? error.stack?.slice(0, 500) : undefined,
        },
      })
    }

    return Response.json({ error: message }, { status })
  }
}
