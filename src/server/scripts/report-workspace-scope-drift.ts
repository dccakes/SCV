import { fileURLToPath } from 'node:url'

type DatabaseClient = Awaited<typeof import('~/server/db')>['db']

export type WorkspaceScopeDriftReport = {
  organizationsWithoutWedding: number
  sessionsMissingMembership: number
  sessionsMissingOrganization: number
  sessionsWithOrganizationWithoutWedding: number
  usersWithMultipleOrganizationMemberships: number
  weddingsWithoutOrganization: number
}

type ParsedArgs = {
  json: boolean
}

export const parseArgs = (argv: string[]): ParsedArgs => ({
  json: argv.includes('--json'),
})

const extractCount = (rows: Array<{ count: bigint | number }> | undefined): number => {
  const value = rows?.[0]?.count ?? 0
  return typeof value === 'bigint' ? Number(value) : value
}

export async function reportWorkspaceScopeDrift(
  db: DatabaseClient
): Promise<WorkspaceScopeDriftReport> {
  const [
    weddingsWithoutOrganization,
    organizationsWithoutWedding,
    sessionsMissingOrganization,
    sessionsMissingMembership,
    sessionsWithOrganizationWithoutWedding,
    usersWithMultipleOrganizationMemberships,
  ] = await Promise.all([
    db.$queryRaw<Array<{ count: bigint | number }>>`
      SELECT COUNT(*) AS count
      FROM "Wedding"
      WHERE "organizationId" IS NULL
    `,
    db.$queryRaw<Array<{ count: bigint | number }>>`
      SELECT COUNT(*) AS count
      FROM "organization" o
      LEFT JOIN "Wedding" w ON w."organizationId" = o."id"
      WHERE w."id" IS NULL
    `,
    db.$queryRaw<Array<{ count: bigint | number }>>`
      SELECT COUNT(*) AS count
      FROM "Session" s
      LEFT JOIN "organization" o ON o."id" = s."activeOrganizationId"
      WHERE s."activeOrganizationId" IS NOT NULL
        AND o."id" IS NULL
    `,
    db.$queryRaw<Array<{ count: bigint | number }>>`
      SELECT COUNT(*) AS count
      FROM "Session" s
      LEFT JOIN "member" m
        ON m."organizationId" = s."activeOrganizationId"
       AND m."userId" = s."userId"
      WHERE s."activeOrganizationId" IS NOT NULL
        AND m."id" IS NULL
    `,
    db.$queryRaw<Array<{ count: bigint | number }>>`
      SELECT COUNT(*) AS count
      FROM "Session" s
      LEFT JOIN "Wedding" w ON w."organizationId" = s."activeOrganizationId"
      WHERE s."activeOrganizationId" IS NOT NULL
        AND w."id" IS NULL
    `,
    db.$queryRaw<Array<{ count: bigint | number }>>`
      SELECT COUNT(*) AS count
      FROM (
        SELECT "userId"
        FROM "member"
        GROUP BY "userId"
        HAVING COUNT(*) > 1
      ) multi_org_users
    `,
  ])

  return {
    organizationsWithoutWedding: extractCount(organizationsWithoutWedding),
    sessionsMissingMembership: extractCount(sessionsMissingMembership),
    sessionsMissingOrganization: extractCount(sessionsMissingOrganization),
    sessionsWithOrganizationWithoutWedding: extractCount(sessionsWithOrganizationWithoutWedding),
    usersWithMultipleOrganizationMemberships: extractCount(
      usersWithMultipleOrganizationMemberships
    ),
    weddingsWithoutOrganization: extractCount(weddingsWithoutOrganization),
  }
}

export const formatWorkspaceScopeDriftReport = (
  report: WorkspaceScopeDriftReport,
  json = false
): string => {
  if (json) {
    return JSON.stringify(report, null, 2)
  }

  return [
    'Workspace Scope Drift Report',
    `- weddingsWithoutOrganization: ${report.weddingsWithoutOrganization}`,
    `- organizationsWithoutWedding: ${report.organizationsWithoutWedding}`,
    `- sessionsMissingOrganization: ${report.sessionsMissingOrganization}`,
    `- sessionsMissingMembership: ${report.sessionsMissingMembership}`,
    `- sessionsWithOrganizationWithoutWedding: ${report.sessionsWithOrganizationWithoutWedding}`,
    `- usersWithMultipleOrganizationMemberships: ${report.usersWithMultipleOrganizationMemberships}`,
  ].join('\n')
}

const run = async (): Promise<void> => {
  const { db } = await import('~/server/db')
  const args = parseArgs(process.argv.slice(2))
  const report = await reportWorkspaceScopeDrift(db)
  process.stdout.write(`${formatWorkspaceScopeDriftReport(report, args.json)}\n`)
}

const entryFilePath = process.argv[1]
const moduleFilePath = fileURLToPath(import.meta.url)

if (entryFilePath && entryFilePath === moduleFilePath) {
  run()
    .catch((error) => {
      process.stderr.write(`Workspace scope drift report failed: ${String(error)}\n`)
      process.exit(1)
    })
    .finally(async () => {
      const { db } = await import('~/server/db')
      await db.$disconnect()
    })
}
