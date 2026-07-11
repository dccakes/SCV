/**
 * Analytics Context Extraction (server)
 *
 * Pure helpers that mine the tRPC request (context, input, and result) for the
 * identifying properties we want on every backend analytics event:
 *
 * - `distinctId`  — the PostHog actor. Authenticated user id when available,
 *                   otherwise a stable guest token, otherwise `anonymous`.
 * - `weddingId`   — always attached when we can find it (auth scope, input, or
 *                   the mutation result for public flows that resolve it late).
 * - `token`       — invite / access / self-fill token, when present.
 * - `householdId` — resolved household, when known.
 * - `subUrl`      — public wedding website slug, when present.
 *
 * These are intentionally best-effort and never throw: analytics must not be
 * able to break a real request.
 */

const ANONYMOUS_DISTINCT_ID = 'anonymous'

/** Narrow an unknown value to a plain record we can safely read keys from. */
function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

/** Return the first defined, non-empty string among the provided candidates. */
function firstString(...candidates: unknown[]): string | undefined {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate
    }
  }
  return undefined
}

export interface AnalyticsContextInput {
  ctx: {
    auth?: {
      userId?: string | null
      activeWeddingId?: string | null
    } | null
  }
  input: unknown
  result?: unknown
}

export interface ResolvedAnalyticsContext {
  distinctId: string
  isAuthenticated: boolean
  userId?: string
  weddingId?: string
  token?: string
  householdId?: string
  subUrl?: string
}

/**
 * Extract the identifying analytics properties from a tRPC request.
 */
export function extractAnalyticsContext({
  ctx,
  input,
  result,
}: AnalyticsContextInput): ResolvedAnalyticsContext {
  const inputRecord = asRecord(input)
  const resultRecord = asRecord(result)
  const nestedHousehold = asRecord(resultRecord.household)
  const nestedWedding = asRecord(resultRecord.wedding)

  const userId = firstString(ctx?.auth?.userId)

  const token = firstString(inputRecord.inviteToken, inputRecord.accessToken, inputRecord.token)

  const weddingId = firstString(
    ctx?.auth?.activeWeddingId,
    inputRecord.weddingId,
    resultRecord.weddingId,
    nestedWedding.id
  )

  const householdId = firstString(
    inputRecord.householdId,
    resultRecord.householdId,
    nestedHousehold.id
  )

  const subUrl = firstString(inputRecord.subUrl)

  const distinctId = userId ?? token ?? ANONYMOUS_DISTINCT_ID

  return {
    distinctId,
    isAuthenticated: Boolean(userId),
    ...(userId ? { userId } : {}),
    ...(weddingId ? { weddingId } : {}),
    ...(token ? { token } : {}),
    ...(householdId ? { householdId } : {}),
    ...(subUrl ? { subUrl } : {}),
  }
}
