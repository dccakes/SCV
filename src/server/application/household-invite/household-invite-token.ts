import { createHmac, timingSafeEqual } from 'node:crypto'

const HOUSEHOLD_INVITE_PURPOSE = 'household-invite'

type HouseholdInviteTokenPayload = {
  purpose: string
  weddingId: string
  householdId: string
  exp: number
}

type CreateHouseholdInviteTokenInput = {
  weddingId: string
  householdId: string
  expiresAt?: Date
  purpose?: string
}

export type VerifiedHouseholdInviteToken = {
  weddingId: string
  householdId: string
  expiresAt: Date
}

const getInviteSecret = () => {
  const secret = process.env.BETTER_AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET is required to sign household invite tokens')
  }
  return secret
}

const getDefaultExpiresAt = () => {
  const expiresAt = new Date()
  expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + 1)
  return expiresAt
}

const sign = (payload: string) =>
  createHmac('sha256', getInviteSecret()).update(payload).digest('base64url')

export const createHouseholdInviteToken = ({
  weddingId,
  householdId,
  expiresAt = getDefaultExpiresAt(),
  purpose = HOUSEHOLD_INVITE_PURPOSE,
}: CreateHouseholdInviteTokenInput) => {
  const payload: HouseholdInviteTokenPayload = {
    purpose,
    weddingId,
    householdId,
    exp: Math.floor(expiresAt.getTime() / 1000),
  }
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encodedPayload}.${sign(encodedPayload)}`
}

const signaturesMatch = (actual: string, expected: string) => {
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)
  return (
    actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
  )
}

export const verifyHouseholdInviteToken = (
  token: string | null | undefined
): VerifiedHouseholdInviteToken | null => {
  if (!token) return null

  const [encodedPayload, signature, ...extraParts] = token.split('.')
  if (!encodedPayload || !signature || extraParts.length > 0) return null

  if (!signaturesMatch(signature, sign(encodedPayload))) return null

  let payload: HouseholdInviteTokenPayload
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'))
  } catch {
    return null
  }

  if (payload.purpose !== HOUSEHOLD_INVITE_PURPOSE) return null
  if (!payload.weddingId || !payload.householdId || typeof payload.exp !== 'number') return null

  const expiresAt = new Date(payload.exp * 1000)
  if (expiresAt.getTime() <= Date.now()) return null

  return {
    weddingId: payload.weddingId,
    householdId: payload.householdId,
    expiresAt,
  }
}
