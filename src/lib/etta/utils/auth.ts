import { jwtVerify, SignJWT } from 'jose'
import { auth } from '~/lib/auth'
import type { EttaRequest } from '~/lib/etta/types'
import type { ActiveOrganization, AuthzContext } from '~/server/authz/authorization.types'
import { db } from '~/server/db'
import { weddingService } from '~/server/domains/wedding'

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
    throw new Error('No active session')
  }

  const userId = session.user.id

  // Resolve active organization from session (mirrors tRPC protectedProcedure)
  const activeOrganization = await resolveActiveOrganization(userId, session)

  const weddingId = await weddingService.getWeddingIdByUserId(
    userId,
    activeOrganization?.organizationId ?? null
  )

  const authz: AuthzContext = { userId, activeOrganization }

  return { weddingId, userId, authz }
}

async function resolveActiveOrganization(
  userId: string,
  session: unknown
): Promise<ActiveOrganization | null> {
  const orgId = getSessionActiveOrganizationId(session)

  if (orgId) {
    const rows = await db.$queryRaw<Array<{ role: string }>>`
      SELECT "role" FROM "member"
      WHERE "userId" = ${userId} AND "organizationId" = ${orgId}
      LIMIT 1
    `
    const row = rows[0]
    return row ? { organizationId: orgId, role: row.role } : null
  }

  // Auto-activate first organization if none set
  const rows = await db.$queryRaw<Array<{ organizationId: string; role: string }>>`
    SELECT "organizationId", "role" FROM "member"
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" ASC
    LIMIT 1
  `
  return rows[0] ?? null
}

function getSessionActiveOrganizationId(session: unknown): string | null {
  if (!session || typeof session !== 'object') return null

  const sessionRecord =
    'session' in session && typeof session.session === 'object' && session.session !== null
      ? (session.session as Record<string, unknown>)
      : null

  if (!sessionRecord) return null

  const activeOrganizationId = sessionRecord.activeOrganizationId
  if (typeof activeOrganizationId === 'string' && activeOrganizationId.length > 0) {
    return activeOrganizationId
  }

  return null
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
    throw new Error('Invalid guest token: missing claims')
  }

  return { weddingId, guestId: Number(sub) }
}

// ── Request Resolution ──────────────────────────────────────────────────────

export async function resolveEttaAuth(req: Request): Promise<EttaRequest> {
  const body = await req.json()
  const { messages, persona, guestToken } = body

  if (persona === 'concierge' && guestToken) {
    const { weddingId, guestId } = await validateGuestToken(guestToken)
    return { actor: 'guest', weddingId, guestId, messages }
  }

  const { weddingId, authz } = await validateCoupleSession(req.headers)
  return { actor: 'couple', weddingId, authz, messages }
}
