import type { ActiveOrganization } from '~/server/authz/authorization.types'
import { db } from '~/server/db'

// TODO(review-implementation): move this request-scope resolver behind an application/infrastructure
// boundary so authz consumes resolved scope instead of owning session persistence and raw SQL directly.
type WorkspaceScope = {
  activeOrganization: ActiveOrganization | null
  activeWeddingId: string | null
}

type WorkspaceScopeRow = {
  organizationId: string
  isPrimaryWedding: boolean
  role: string | null
  weddingId: string | null
}

const getSessionToken = (session: unknown): string | null => {
  if (!session || typeof session !== 'object') {
    return null
  }

  const sessionRecord =
    'session' in session && typeof session.session === 'object' && session.session !== null
      ? (session.session as Record<string, unknown>)
      : null

  if (!sessionRecord) {
    return null
  }

  const sessionToken = sessionRecord.token
  return typeof sessionToken === 'string' && sessionToken.length > 0 ? sessionToken : null
}

export const getSessionActiveOrganizationId = (session: unknown): string | null => {
  if (!session || typeof session !== 'object') {
    return null
  }

  const sessionRecord =
    'session' in session && typeof session.session === 'object' && session.session !== null
      ? (session.session as Record<string, unknown>)
      : null

  if (!sessionRecord) {
    return null
  }

  const activeOrganizationId = sessionRecord.activeOrganizationId
  if (typeof activeOrganizationId === 'string' && activeOrganizationId.length > 0) {
    return activeOrganizationId
  }

  const activeOrganization =
    typeof sessionRecord.activeOrganization === 'object' &&
    sessionRecord.activeOrganization !== null
      ? (sessionRecord.activeOrganization as Record<string, unknown>)
      : null

  const nestedOrganizationId = activeOrganization?.id
  if (typeof nestedOrganizationId === 'string' && nestedOrganizationId.length > 0) {
    return nestedOrganizationId
  }

  return null
}

const toWorkspaceScope = (row: WorkspaceScopeRow | undefined): WorkspaceScope => ({
  activeOrganization: row
    ? {
        organizationId: row.organizationId,
        role: row.role,
      }
    : null,
  activeWeddingId: row?.weddingId ?? null,
})

const findScopeForOrganization = async (
  userId: string,
  organizationId: string
): Promise<WorkspaceScopeRow | undefined> => {
  const rows = await db.$queryRaw<WorkspaceScopeRow[]>`
    SELECT
      m."organizationId" AS "organizationId",
      FALSE AS "isPrimaryWedding",
      m."role" AS "role",
      w."id" AS "weddingId"
    FROM "member" m
    LEFT JOIN "Wedding" w ON w."organizationId" = m."organizationId"
    WHERE m."userId" = ${userId}
      AND m."organizationId" = ${organizationId}
    LIMIT 1
  `

  return rows[0]
}

const findCandidateScopes = async (userId: string): Promise<WorkspaceScopeRow[]> => {
  return db.$queryRaw<WorkspaceScopeRow[]>`
    SELECT
      m."organizationId" AS "organizationId",
      COALESCE(BOOL_OR(uw."isPrimary"), FALSE) AS "isPrimaryWedding",
      m."role" AS "role",
      w."id" AS "weddingId"
    FROM "member" m
    JOIN "Wedding" w ON w."organizationId" = m."organizationId"
    LEFT JOIN "UserWedding" uw
      ON uw."userId" = m."userId"
     AND uw."weddingId" = w."id"
    WHERE m."userId" = ${userId}
    GROUP BY
      m."organizationId",
      m."role",
      w."id",
      m."createdAt"
    ORDER BY
      COALESCE(BOOL_OR(uw."isPrimary"), FALSE) DESC,
      m."createdAt" ASC
  `
}

const persistActiveOrganizationId = async (
  sessionToken: string | null,
  organizationId: string
): Promise<void> => {
  if (!sessionToken) {
    return
  }

  await db.$executeRaw`
    UPDATE "Session"
    SET "activeOrganizationId" = ${organizationId}
    WHERE "token" = ${sessionToken}
      AND ("activeOrganizationId" IS NULL OR "activeOrganizationId" != ${organizationId})
  `
}

const clearActiveOrganizationId = async (sessionToken: string | null): Promise<void> => {
  if (!sessionToken) {
    return
  }

  await db.$executeRaw`
    UPDATE "Session"
    SET "activeOrganizationId" = NULL
    WHERE "token" = ${sessionToken}
      AND "activeOrganizationId" IS NOT NULL
  `
}

export async function resolveWorkspaceScope(input: {
  session: unknown
  userId: string
}): Promise<WorkspaceScope> {
  const { session, userId } = input
  const sessionActiveOrganizationId = getSessionActiveOrganizationId(session)
  const sessionToken = getSessionToken(session)

  if (sessionActiveOrganizationId) {
    const scopedRow = await findScopeForOrganization(userId, sessionActiveOrganizationId)
    if (scopedRow?.weddingId) {
      return toWorkspaceScope(scopedRow)
    }

    await clearActiveOrganizationId(sessionToken)
  }

  const candidateScopes = await findCandidateScopes(userId)
  const primaryWeddingScope = candidateScopes.find((scope) => scope.isPrimaryWedding)
  if (primaryWeddingScope?.organizationId && primaryWeddingScope.weddingId) {
    await persistActiveOrganizationId(sessionToken, primaryWeddingScope.organizationId)
    return toWorkspaceScope(primaryWeddingScope)
  }

  if (candidateScopes.length === 1) {
    const scopedRow = candidateScopes[0]
    if (scopedRow) {
      await persistActiveOrganizationId(sessionToken, scopedRow.organizationId)
      return toWorkspaceScope(scopedRow)
    }
  }

  return {
    activeOrganization: null,
    activeWeddingId: null,
  }
}
