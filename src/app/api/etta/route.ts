/**
 * POST /api/etta — Main Etta agent endpoint
 *
 * Accepts chat messages, validates auth (couple session or guest JWT),
 * and streams a response via the Vercel AI SDK.
 */

import { createUIMessageStreamResponse, toUIMessageStream } from 'ai'

import { runEttaAgent } from '~/lib/etta/agent'
import { logAudit } from '~/lib/etta/utils/audit'
import { EttaAuthError, resolveEttaAuth } from '~/lib/etta/utils/auth'
import { logger } from '~/lib/observability/logger'
import { captureServerException } from '~/server/infrastructure/observability/capture-exception'
import { enforceRateLimit, rateLimitedResponse } from '~/server/infrastructure/rate-limit'

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

    // Limit per authenticated identity (couple user or guest), not IP: each call costs LLM spend.
    const identity = ettaReq.authz?.userId ?? `guest:${ettaReq.weddingId}:${ettaReq.guestId}`
    const limit = await enforceRateLimit('etta', identity)
    if (!limit.allowed) {
      return rateLimitedResponse(limit)
    }

    const result = await runEttaAgent(ettaReq)
    // Error parts are masked as "An error occurred."; the real error goes to
    // error tracking from streamText's onError (see agent.ts).
    return createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = inferAuthStatus(error, message)

    // Auth, scope, and missing-config (503) outcomes are expected; only an
    // unexplained 500 is a bug worth an error-tracking issue.
    if (status === 500) {
      await captureServerException(error, {
        userId: ettaReq?.authz?.userId,
        properties: {
          source: 'etta-route',
          status,
          persona: ettaReq?.actor,
          wedding_id: ettaReq?.weddingId,
        },
      })
    }

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
      logger.error('Etta chat error before auth', { component: 'etta', status, error: message })
    }

    return Response.json({ error: message }, { status })
  }
}
