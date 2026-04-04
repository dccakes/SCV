import { fileURLToPath } from 'node:url'
import { parseOptionalEqualsArg } from '~/server/scripts/script-args'

type DatabaseClient = Awaited<typeof import('~/server/db')>['db']

export type WorkspaceScopeDriftReport = {
  organizationsWithoutWedding: number
  sessionsMissingMembership: number
  sessionsMissingOrganization: number
  sessionsWithOrganizationWithoutWedding: number
  usersWithMultipleOrganizationMemberships: number
  weddingsWithoutOrganization: number
}

export type ParsedArgs = {
  customerEmail: string | null
  json: boolean
  sql: boolean
}

export const parseArgs = (argv: string[]): ParsedArgs => ({
  customerEmail: parseOptionalEqualsArg(argv, '--customer-email'),
  json: argv.includes('--json'),
  sql: argv.includes('--sql'),
})

export const validateArgs = (args: ParsedArgs): void => {
  if (args.json && args.sql) {
    throw new Error('Cannot combine --json and --sql.')
  }

  if (args.customerEmail && !args.sql) {
    throw new Error('--customer-email can only be used together with --sql.')
  }
}

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
        HAVING COUNT(DISTINCT "organizationId") > 1
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

export const formatWorkspaceScopeDriftSqlChecklist = (input: {
  customerEmail: string | null
}): string => {
  const escapedCustomerEmail = input.customerEmail?.replaceAll("'", "''") ?? null
  const auditCustomerFilter = escapedCustomerEmail
    ? `where u.email = '${escapedCustomerEmail}'`
    : '-- Optional: add `where u.email = <customer-email>` for single-customer migration.'
  const sessionCustomerFilter = escapedCustomerEmail
    ? `  and u.email = '${escapedCustomerEmail}'`
    : '-- Optional: add `and u.email = <customer-email>` for single-customer migration.'

  return [
    'Workspace Scope Drift SQL Checklist',
    '',
    '-- 1) Audit role and workspace linkage',
    `select`,
    `  u.email,`,
    `  m."organizationId",`,
    `  m.role as member_role,`,
    `  uw.role as user_wedding_role,`,
    `  uw."isPrimary",`,
    `  w.id as wedding_id,`,
    `  w."organizationId" as wedding_organization_id`,
    `from "User" u`,
    `left join member m on m."userId" = u.id`,
    `left join "Wedding" w on w."organizationId" = m."organizationId"`,
    `left join "UserWedding" uw on uw."userId" = u.id and uw."weddingId" = w.id`,
    auditCustomerFilter,
    `order by u.email, m."organizationId", w.id;`,
    '',
    '-- 2) Find sessions pinned to invalid organizations',
    `select`,
    `  s.id as session_id,`,
    `  u.email,`,
    `  s."userId",`,
    `  s."activeOrganizationId"`,
    `from "Session" s`,
    `join "User" u on u.id = s."userId"`,
    `left join "Wedding" w on w."organizationId" = s."activeOrganizationId"`,
    `where s."activeOrganizationId" is not null`,
    `  and w.id is null`,
    sessionCustomerFilter,
    `order by s."updatedAt" desc;`,
    '',
    '-- 3) Transaction template for single-customer fix (review first, then run)',
    'BEGIN;',
    '-- Prefer the automated repair script when possible:',
    '-- pnpm tsx src/server/scripts/repair-workspace-scope-data.ts --write',
    '-- example: repair one session identified above',
    `-- update "Session"`,
    `-- set "activeOrganizationId" = '<resolved-organization-id>', "updatedAt" = now()`,
    `-- where "id" = '<session-id>';`,
    '-- or, if no valid organization exists for that session:',
    `-- update "Session"`,
    `-- set "activeOrganizationId" = null, "updatedAt" = now()`,
    `-- where "id" = '<session-id>';`,
    'COMMIT;',
  ].join('\n')
}

export const runWorkspaceScopeDriftCommand = async (
  argv: string[],
  deps: {
    loadDb?: () => Promise<DatabaseClient>
    writeStdout?: (output: string) => void
  } = {}
): Promise<void> => {
  const args = parseArgs(argv)
  validateArgs(args)

  const writeStdout = deps.writeStdout ?? ((output: string) => process.stdout.write(output))
  if (args.sql) {
    writeStdout(`${formatWorkspaceScopeDriftSqlChecklist({ customerEmail: args.customerEmail })}\n`)
    return
  }

  const loadDb = deps.loadDb ?? (async () => (await import('~/server/db')).db)
  const db = await loadDb()
  const report = await reportWorkspaceScopeDrift(db)
  try {
    writeStdout(`${formatWorkspaceScopeDriftReport(report, args.json)}\n`)
  } finally {
    await db.$disconnect()
  }
}

const entryFilePath = process.argv[1]
const moduleFilePath = fileURLToPath(import.meta.url)

if (entryFilePath && entryFilePath === moduleFilePath) {
  runWorkspaceScopeDriftCommand(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`Workspace scope drift report failed: ${String(error)}\n`)
    process.exit(1)
  })
}
