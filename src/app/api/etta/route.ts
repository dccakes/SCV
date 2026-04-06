/**
 * POST /api/etta — Main Etta agent endpoint
 *
 * Accepts chat messages, validates auth (couple session or guest JWT),
 * and streams a response via the Vercel AI SDK.
 */

import { runEttaAgent } from '~/lib/etta/agent'
import { logAudit } from '~/lib/etta/utils/audit'
import { EttaAuthError, resolveEttaAuth } from '~/lib/etta/utils/auth'

const inferAuthStatus = (error: unknown, message: string): number => {
  if (error instanceof EttaAuthError) {
    return error.status
  }
  if (message === 'No active session' || message.startsWith('Invalid guest token:')) {
    return 401
  }
  if (message === 'No active wedding in workspace scope') {
    return 412
  }
  if (message === 'No wedding found for user') {
    return 404
  }
  if (message.startsWith('Etta is not configured:')) {
    return 503
  }
  return 500
}

export async function POST(req: Request) {
  let ettaReq: Awaited<ReturnType<typeof resolveEttaAuth>> | null = null

  try {
    ettaReq = await resolveEttaAuth(req)
    const result = await runEttaAgent(ettaReq)
    return result.toUIMessageStreamResponse()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = inferAuthStatus(error, message)

    // Only write audit log if we have a valid weddingId (FK constraint)
    if (ettaReq?.weddingId) {
      await logAudit({
        weddingId: ettaReq.weddingId,
        actorId: ettaReq.authz?.userId ?? `guest:${ettaReq.guestId}`,
        actorType: ettaReq.actor === 'guest' ? 'guest' : 'couple',
        action: 'chat_error',
        resourceType: 'conversation',
        payload: { error: message, status },
      })
    } else {
      // biome-ignore lint/suspicious/noConsole: error logging for unauthenticated requests
      console.error('[Etta] Chat error (pre-auth):', message)
    }

    return Response.json({ error: message }, { status })
  }
}
