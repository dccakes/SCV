import { fileURLToPath } from 'node:url'
import { Prisma } from '@prisma/client'
import { parseDryRunArgs } from '~/server/scripts/script-args'

type DatabaseClient = Awaited<typeof import('~/server/db')>['db']

type ParsedArgs = {
  dryRun: boolean
}

type SessionRepairRow = {
  currentActiveOrganizationId: string | null
  primaryWeddingOrganizationId: string | null
  sessionId: string
  validOrganizationIds: string[] | null
}

export type SessionRepairAction = 'clear' | 'keep' | 'noop' | 'set'

export const parseArgs = (argv: string[]): ParsedArgs => ({
  dryRun: parseDryRunArgs(argv).dryRun,
})

const unique = (values: string[]): string[] => Array.from(new Set(values))

export const decideSessionRepair = (input: {
  currentActiveOrganizationId: string | null
  primaryWeddingOrganizationId: string | null
  validOrganizationIds: string[]
}): { action: SessionRepairAction; nextActiveOrganizationId: string | null } => {
  const validOrganizationIds = unique(input.validOrganizationIds.filter(Boolean))

  if (
    input.currentActiveOrganizationId &&
    validOrganizationIds.includes(input.currentActiveOrganizationId)
  ) {
    return {
      action: 'keep',
      nextActiveOrganizationId: input.currentActiveOrganizationId,
    }
  }

  if (
    input.primaryWeddingOrganizationId &&
    validOrganizationIds.includes(input.primaryWeddingOrganizationId)
  ) {
    return {
      action: 'set',
      nextActiveOrganizationId: input.primaryWeddingOrganizationId,
    }
  }

  if (validOrganizationIds.length === 1) {
    return {
      action: 'set',
      nextActiveOrganizationId: validOrganizationIds[0] ?? null,
    }
  }

  if (input.currentActiveOrganizationId) {
    return {
      action: 'clear',
      nextActiveOrganizationId: null,
    }
  }

  return {
    action: 'noop',
    nextActiveOrganizationId: null,
  }
}

const loadSessionRepairRows = async (db: DatabaseClient): Promise<SessionRepairRow[]> => {
  return db.$queryRaw<SessionRepairRow[]>`
    SELECT
      s."id" AS "sessionId",
      s."activeOrganizationId" AS "currentActiveOrganizationId",
      primary_wedding."organizationId" AS "primaryWeddingOrganizationId",
      COALESCE(
        ARRAY_AGG(DISTINCT valid_wedding."organizationId")
          FILTER (WHERE valid_wedding."organizationId" IS NOT NULL),
        ARRAY[]::text[]
      ) AS "validOrganizationIds"
    FROM "Session" s
    LEFT JOIN (
      SELECT DISTINCT ON (uw."userId")
        uw."userId",
        w."organizationId"
      FROM "UserWedding" uw
      JOIN "Wedding" w ON w."id" = uw."weddingId"
      WHERE w."organizationId" IS NOT NULL
      ORDER BY uw."userId", uw."isPrimary" DESC, uw."createdAt" ASC
    ) primary_wedding ON primary_wedding."userId" = s."userId"
    LEFT JOIN "member" m ON m."userId" = s."userId"
    LEFT JOIN "Wedding" valid_wedding ON valid_wedding."organizationId" = m."organizationId"
    GROUP BY
      s."id",
      s."activeOrganizationId",
      primary_wedding."organizationId"
  `
}

export async function repairWorkspaceScopeData(
  db: DatabaseClient,
  dryRun = true
): Promise<Record<SessionRepairAction, number>> {
  const summary: Record<SessionRepairAction, number> = {
    clear: 0,
    keep: 0,
    noop: 0,
    set: 0,
  }

  const rows = await loadSessionRepairRows(db)
  const sessionsToClear: string[] = []
  const sessionsToSet = new Map<string, string[]>()

  for (const row of rows) {
    const decision = decideSessionRepair({
      currentActiveOrganizationId: row.currentActiveOrganizationId,
      primaryWeddingOrganizationId: row.primaryWeddingOrganizationId,
      validOrganizationIds: row.validOrganizationIds ?? [],
    })

    summary[decision.action] += 1

    if (dryRun || decision.action === 'keep' || decision.action === 'noop') {
      continue
    }

    if (decision.action === 'clear') {
      sessionsToClear.push(row.sessionId)
      continue
    }

    if (decision.action === 'set' && decision.nextActiveOrganizationId) {
      const sessionIds = sessionsToSet.get(decision.nextActiveOrganizationId) ?? []
      sessionIds.push(row.sessionId)
      sessionsToSet.set(decision.nextActiveOrganizationId, sessionIds)
    }
  }

  if (!dryRun && sessionsToClear.length > 0) {
    await db.$executeRaw(
      Prisma.sql`
        UPDATE "Session"
        SET
          "activeOrganizationId" = NULL,
          "updatedAt" = NOW()
        WHERE "id" IN (${Prisma.join(sessionsToClear)})
      `
    )
  }

  if (!dryRun) {
    for (const [organizationId, sessionIds] of sessionsToSet) {
      await db.$executeRaw(
        Prisma.sql`
          UPDATE "Session"
          SET
            "activeOrganizationId" = ${organizationId},
            "updatedAt" = NOW()
          WHERE "id" IN (${Prisma.join(sessionIds)})
        `
      )
    }
  }

  return summary
}

const run = async (): Promise<void> => {
  const { db } = await import('~/server/db')
  const args = parseArgs(process.argv.slice(2))
  const summary = await repairWorkspaceScopeData(db, args.dryRun)
  process.stdout.write(`${JSON.stringify({ dryRun: args.dryRun, summary }, null, 2)}\n`)
}

const entryFilePath = process.argv[1]
const moduleFilePath = fileURLToPath(import.meta.url)

if (entryFilePath && entryFilePath === moduleFilePath) {
  run()
    .catch((error) => {
      process.stderr.write(`Workspace scope repair failed: ${String(error)}\n`)
      process.exit(1)
    })
    .finally(async () => {
      const { db } = await import('~/server/db')
      await db.$disconnect()
    })
}
