import { convertToModelMessages } from 'ai'
import { jwtVerify, SignJWT } from 'jose'
import { auth } from '~/lib/auth'
import type { EttaRequest } from '~/lib/etta/types'
import { POSTHOG_SESSION_ID_HEADER } from '~/lib/observability/config'
import { resolveWorkspaceScope } from '~/server/application/workspace/workspace-scope'
import type { AuthzContext } from '~/server/authz/authorization.types'

export class EttaAuthError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403 | 412
  ) {
    super(message)
    this.name = 'EttaAuthError'
  }
}

async function normalizeMessages(messages: unknown): Promise<EttaRequest['messages']> {
  if (!Array.isArray(messages)) {
    throw new Error('Invalid request: messages must be an array')
  }

  if (
    messages.every(
      (message) =>
        message &&
        typeof message === 'object' &&
        'role' in message &&
        'content' in message &&
        typeof (message as { role?: unknown }).role === 'string'
    )
  ) {
    return messages as EttaRequest['messages']
  }

  return convertToModelMessages(messages)
}

// ── Couple Session ──────────────────────────────────────────────────────────

/**
 * Resolves the AuthzContext for the requesting user — Etta operates with
 * the same permissions as the couple member who is chatting.
 */
export async function validateCoupleSession(
  headers: Headers
): Promise<{ weddingId: string; userId: string; authz: AuthzContext }> {
  const session = await auth.api.getSession({ headers })
  if (!session) {
    throw new EttaAuthError('No active session', 401)
  }

  const userId = session.user.id
  const { activeOrganization, activeWeddingId } = await resolveWorkspaceScope({
    session,
    userId,
  })

  if (!activeWeddingId) {
    throw new EttaAuthError('No active wedding in workspace scope', 412)
  }

  const authz: AuthzContext = { userId, activeOrganization }

  return { weddingId: activeWeddingId, userId, authz }
}

// ── Guest Tokens ────────────────────────────────────────────────────────────

let _jwtSecret: Uint8Array | null = null
function getJwtSecret(): Uint8Array {
  if (!_jwtSecret) {
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET environment variable is not set')
    _jwtSecret = new TextEncoder().encode(secret)
  }
  return _jwtSecret
}

export async function issueGuestToken(weddingId: string, guestId: number): Promise<string> {
  return new SignJWT({ sub: String(guestId), weddingId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getJwtSecret())
}

export async function validateGuestToken(
  token: string
): Promise<{ weddingId: string; guestId: number }> {
  const { payload } = await jwtVerify(token, getJwtSecret())

  const weddingId = payload.weddingId as string | undefined
  const sub = payload.sub

  if (!weddingId || !sub) {
    throw new EttaAuthError('Invalid guest token: missing claims', 401)
  }

  return { weddingId, guestId: Number(sub) }
}

// ── Request Resolution ──────────────────────────────────────────────────────

/** Client-sent ids only group telemetry, so anything unexpected is dropped, never rejected. */
const TELEMETRY_ID = /^[A-Za-z0-9_-]{1,128}$/

const telemetryId = (value: unknown): string | undefined =>
  typeof value === 'string' && TELEMETRY_ID.test(value) ? value : undefined

/**
 * PostHog AI observability grouping: the `useChat` id (one per conversation)
 * and the posthog-js session id header (links the trace to its replay).
 */
function resolveTelemetryIds(
  req: Request,
  body: { id?: unknown }
): Pick<EttaRequest, 'conversationId' | 'browserSessionId'> {
  const chatId = telemetryId(body.id)
  const browserSessionId = telemetryId(req.headers.get(POSTHOG_SESSION_ID_HEADER))
  return {
    ...(chatId ? { conversationId: `web:${chatId}` } : {}),
    ...(browserSessionId ? { browserSessionId } : {}),
  }
}

export async function resolveEttaAuth(req: Request): Promise<EttaRequest> {
  const body = await req.json()
  const { messages, persona, guestToken } = body
  const modelMessages = await normalizeMessages(messages)
  const telemetryIds = resolveTelemetryIds(req, body)

  if (persona === 'concierge' && guestToken) {
    const { weddingId, guestId } = await validateGuestToken(guestToken)
    return { actor: 'guest', weddingId, guestId, messages: modelMessages, ...telemetryIds }
  }

  const { weddingId, authz } = await validateCoupleSession(req.headers)
  return { actor: 'couple', weddingId, authz, messages: modelMessages, ...telemetryIds }
}
