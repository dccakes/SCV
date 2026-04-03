import type { ActiveOrganization } from '~/server/authz/authorization.types'
import { db } from '~/server/db'

type WorkspaceScope = {
  activeOrganization: ActiveOrganization | null
  activeWeddingId: string | null
}

type WorkspaceScopeRow = {
  organizationId: string
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

const findPrimaryWeddingScope = async (userId: string): Promise<WorkspaceScopeRow | undefined> => {
  const rows = await db.$queryRaw<WorkspaceScopeRow[]>`
    SELECT
      w."organizationId" AS "organizationId",
      m."role" AS "role",
      w."id" AS "weddingId"
    FROM "UserWedding" uw
    JOIN "Wedding" w ON w."id" = uw."weddingId"
    JOIN "member" m
      ON m."organizationId" = w."organizationId"
     AND m."userId" = uw."userId"
    WHERE uw."userId" = ${userId}
      AND w."organizationId" IS NOT NULL
    ORDER BY uw."isPrimary" DESC, uw."createdAt" ASC
    LIMIT 1
  `

  return rows[0]
}

const findValidScopes = async (userId: string): Promise<WorkspaceScopeRow[]> => {
  return db.$queryRaw<WorkspaceScopeRow[]>`
    SELECT
      m."organizationId" AS "organizationId",
      m."role" AS "role",
      w."id" AS "weddingId"
    FROM "member" m
    JOIN "Wedding" w ON w."organizationId" = m."organizationId"
    WHERE m."userId" = ${userId}
    ORDER BY m."createdAt" ASC
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

  const primaryWeddingScope = await findPrimaryWeddingScope(userId)
  if (primaryWeddingScope?.organizationId && primaryWeddingScope.weddingId) {
    await persistActiveOrganizationId(sessionToken, primaryWeddingScope.organizationId)
    return toWorkspaceScope(primaryWeddingScope)
  }

  const validScopes = await findValidScopes(userId)
  if (validScopes.length === 1) {
    const scopedRow = validScopes[0]
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
