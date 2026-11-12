import { randomUUID } from 'node:crypto'

import type { OrganizationRole } from '~/server/authz/wedding-organization'
import type { WorkspaceScopeRow } from '~/server/authz/workspace-scope-resolver'
import { db } from '~/server/db'

/** A wedding created before workspaces existed, with everyone linked to it. */
export type OrganizationlessWedding = {
  weddingId: string
  groomFirstName: string
  brideFirstName: string
  members: Array<{ userId: string; role: string }>
}

export type AttachOrganizationInput = {
  weddingId: string
  name: string
  slug: string
  members: Array<{ userId: string; role: OrganizationRole }>
}

/** Thrown inside the transaction to roll it back when another request won the race. */
class AlreadyLinkedError extends Error {}

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002'

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

  async findOrganizationlessWedding(userId: string): Promise<OrganizationlessWedding | null> {
    const link = await db.userWedding.findFirst({
      where: { userId, wedding: { organizationId: null } },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      select: {
        wedding: {
          select: {
            id: true,
            groomFirstName: true,
            brideFirstName: true,
            userWeddings: { select: { userId: true, role: true } },
          },
        },
      },
    })
    if (!link) return null

    const { wedding } = link
    return {
      weddingId: wedding.id,
      groomFirstName: wedding.groomFirstName,
      brideFirstName: wedding.brideFirstName,
      members: wedding.userWeddings,
    }
  }

  /**
   * Creates the wedding's workspace and links it, atomically. Returns false,
   * with nothing written, when a concurrent request linked the wedding first
   * (wedding already linked, or the workspace slug already taken).
   */
  async attachOrganization(input: AttachOrganizationInput): Promise<boolean> {
    try {
      await db.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: {
            id: randomUUID(),
            name: input.name,
            slug: input.slug,
            members: {
              create: input.members.map((member) => ({
                id: randomUUID(),
                userId: member.userId,
                role: member.role,
              })),
            },
          },
        })
        const linked = await tx.wedding.updateMany({
          where: { id: input.weddingId, organizationId: null },
          data: { organizationId: organization.id },
        })
        if (linked.count === 0) throw new AlreadyLinkedError()
      })
      return true
    } catch (error) {
      if (error instanceof AlreadyLinkedError || isUniqueViolation(error)) return false
      throw error
    }
  }
}
