import type { WorkspaceScopeRow } from '~/server/authz/workspace-scope-resolver'
import { db } from '~/server/db'

export class WorkspaceScopeRepository {
  async findScopeForOrganization(
    userId: string,
    organizationId: string
  ): Promise<WorkspaceScopeRow | undefined> {
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
      ORDER BY m."createdAt" ASC
      LIMIT 1
    `

    return rows[0]
  }

  async findCandidateScopes(userId: string): Promise<WorkspaceScopeRow[]> {
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
        w."id"
      ORDER BY
        COALESCE(BOOL_OR(uw."isPrimary"), FALSE) DESC,
        MIN(m."createdAt") ASC
    `
  }

  async setActiveOrganizationId(
    sessionToken: string | null,
    organizationId: string | null
  ): Promise<void> {
    if (!sessionToken) {
      return
    }

    await db.$executeRaw`
      UPDATE "Session"
      SET "activeOrganizationId" = ${organizationId}
      WHERE "token" = ${sessionToken}
        AND "activeOrganizationId" IS DISTINCT FROM ${organizationId}
    `
  }
}
