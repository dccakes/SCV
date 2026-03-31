import { SignJWT, jwtVerify } from 'jose'

import type { EttaRequest } from '~/lib/etta/types'
import { auth } from '~/lib/auth'
import { db } from '~/server/db'

// ── Couple Session ──────────────────────────────────────────────────────────

export async function validateCoupleSession(
  headers: Headers,
): Promise<{ weddingId: string; userId: string }> {
  const session = await auth.api.getSession({ headers })
  if (!session) {
    throw new Error('No active session')
  }

  const userId = session.user.id
  const userWedding = await db.userWedding.findFirst({
    where: { userId },
  })
  if (!userWedding) {
    throw new Error('No wedding found for user')
  }

  return { weddingId: userWedding.weddingId, userId }
}

// ── Guest Tokens ────────────────────────────────────────────────────────────

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  return new TextEncoder().encode(secret)
}

export async function issueGuestToken(
  weddingId: string,
  guestId: number,
): Promise<string> {
  return new SignJWT({ sub: String(guestId), weddingId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getJwtSecret())
}

export async function validateGuestToken(
  token: string,
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

  const { weddingId } = await validateCoupleSession(req.headers)
  return { actor: 'couple', weddingId, messages }
}
