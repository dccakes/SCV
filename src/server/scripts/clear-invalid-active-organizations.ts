import { fileURLToPath } from 'node:url'

type DatabaseClient = Awaited<typeof import('~/server/db')>['db']

type ParsedArgs = {
  dryRun: boolean
}

type InvalidSessionRow = {
  sessionId: string
}

export const parseArgs = (argv: string[]): ParsedArgs => ({
  dryRun: !argv.includes('--write'),
})

export async function clearInvalidActiveOrganizations(
  db: DatabaseClient,
  dryRun = true
): Promise<number> {
  const rows = await db.$queryRaw<InvalidSessionRow[]>`
    SELECT s."id" AS "sessionId"
    FROM "Session" s
    LEFT JOIN "organization" o ON o."id" = s."activeOrganizationId"
    LEFT JOIN "member" m
      ON m."organizationId" = s."activeOrganizationId"
     AND m."userId" = s."userId"
    LEFT JOIN "Wedding" w ON w."organizationId" = s."activeOrganizationId"
    WHERE s."activeOrganizationId" IS NOT NULL
      AND (
        o."id" IS NULL
        OR m."id" IS NULL
        OR w."id" IS NULL
      )
  `

  if (!dryRun) {
    for (const row of rows) {
      await db.$executeRaw`
        UPDATE "Session"
        SET
          "activeOrganizationId" = NULL,
          "updatedAt" = NOW()
        WHERE "id" = ${row.sessionId}
      `
    }
  }

  return rows.length
}

const run = async (): Promise<void> => {
  const { db } = await import('~/server/db')
  const args = parseArgs(process.argv.slice(2))
  const affected = await clearInvalidActiveOrganizations(db, args.dryRun)
  process.stdout.write(`${JSON.stringify({ affected, dryRun: args.dryRun }, null, 2)}\n`)
}

const entryFilePath = process.argv[1]
const moduleFilePath = fileURLToPath(import.meta.url)

if (entryFilePath && entryFilePath === moduleFilePath) {
  run()
    .catch((error) => {
      process.stderr.write(`Clearing invalid active organizations failed: ${String(error)}\n`)
      process.exit(1)
    })
    .finally(async () => {
      const { db } = await import('~/server/db')
      await db.$disconnect()
    })
}
