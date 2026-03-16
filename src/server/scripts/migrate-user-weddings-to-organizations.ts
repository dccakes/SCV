import { fileURLToPath } from 'node:url'

type DatabaseClient = Awaited<typeof import('~/server/db')>['db']

type LegacyRole = 'owner' | 'admin' | 'editor' | 'viewer'

export const mapLegacyRole = (role: string): LegacyRole => {
  if (role === 'owner') return 'owner'
  if (role === 'admin') return 'admin'
  if (role === 'editor') return 'editor'
  return 'viewer'
}

export const buildWeddingOrganizationSlug = (weddingId: string): string => {
  return `wedding-${weddingId}`
}

type ParsedArgs = {
  dryRun: boolean
}

export const parseArgs = (argv: string[]): ParsedArgs => {
  const hasWriteFlag = argv.includes('--write')
  const hasDryRunFlag = argv.includes('--dry-run')

  if (hasWriteFlag) {
    return { dryRun: false }
  }

  if (hasDryRunFlag) {
    return { dryRun: true }
  }

  return { dryRun: true }
}

const findOrganizationIdBySlug = async (
  db: DatabaseClient,
  slug: string
): Promise<string | null> => {
  const result = await db.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "organization"
    WHERE "slug" = ${slug}
    LIMIT 1
  `

  return result[0]?.id ?? null
}

const run = async (): Promise<void> => {
  const { db } = await import('~/server/db')
  const args = parseArgs(process.argv.slice(2))

  const weddings = await db.wedding.findMany({
    include: {
      userWeddings: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  let alreadyLinked = 0
  let linked = 0
  let pendingOrganization = 0

  for (const wedding of weddings) {
    if (wedding.organizationId) {
      alreadyLinked += 1
      continue
    }

    const slug = buildWeddingOrganizationSlug(wedding.id)
    const organizationId = await findOrganizationIdBySlug(db, slug)

    if (!organizationId) {
      pendingOrganization += 1
      process.stdout.write(
        `[PENDING_ORG] wedding=${wedding.id} slug=${slug} members=${wedding.userWeddings.length}\n`
      )
      continue
    }

    if (!args.dryRun) {
      await db.wedding.update({
        where: { id: wedding.id },
        data: { organizationId },
      })
    }

    linked += 1

    process.stdout.write(
      `[LINKED] wedding=${wedding.id} organization=${organizationId} dryRun=${String(args.dryRun)}\n`
    )

    for (const member of wedding.userWeddings) {
      process.stdout.write(
        `[MEMBER_PLAN] wedding=${wedding.id} user=${member.userId} role=${mapLegacyRole(member.role)}\n`
      )
    }
  }

  process.stdout.write(
    [
      'UserWedding -> Organization migration summary',
      `- dryRun: ${String(args.dryRun)}`,
      `- weddings: ${weddings.length}`,
      `- alreadyLinked: ${alreadyLinked}`,
      `- linkedThisRun: ${linked}`,
      `- pendingOrganization: ${pendingOrganization}`,
    ].join('\n') + '\n'
  )
}

const entryFilePath = process.argv[1]
const moduleFilePath = fileURLToPath(import.meta.url)

if (entryFilePath && entryFilePath === moduleFilePath) {
  run()
    .catch((error) => {
      process.stderr.write(`Migration failed: ${String(error)}\n`)
      process.exit(1)
    })
    .finally(async () => {
      const { db } = await import('~/server/db')
      await db.$disconnect()
    })
}
