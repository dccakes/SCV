import { randomUUID } from 'node:crypto'
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

const hasTable = async (
  db: DatabaseClient,
  tableName: 'organization' | 'member'
): Promise<boolean> => {
  const qualified = `public.${tableName}`
  const result = await db.$queryRaw<Array<{ regclass: string | null }>>`
    SELECT to_regclass(${qualified}) AS regclass
  `

  return result[0]?.regclass !== null
}

const createOrganization = async (
  db: DatabaseClient,
  input: { weddingId: string; name: string }
) => {
  const organizationId = randomUUID()
  const now = new Date()
  const slug = buildWeddingOrganizationSlug(input.weddingId)

  await db.$executeRaw`
    INSERT INTO "organization" ("id", "name", "slug", "createdAt", "updatedAt")
    VALUES (${organizationId}, ${input.name}, ${slug}, ${now}, ${now})
  `

  return organizationId
}

const ensureMemberRole = async (
  db: DatabaseClient,
  input: {
    organizationId: string
    userId: string
    role: LegacyRole
  }
): Promise<'created' | 'updated' | 'unchanged'> => {
  const existing = await db.$queryRaw<Array<{ id: string; role: string }>>`
    SELECT "id", "role"
    FROM "member"
    WHERE "organizationId" = ${input.organizationId}
      AND "userId" = ${input.userId}
    LIMIT 1
  `

  if (existing.length === 0) {
    const now = new Date()
    await db.$executeRaw`
      INSERT INTO "member" ("id", "organizationId", "userId", "role", "createdAt", "updatedAt")
      VALUES (${randomUUID()}, ${input.organizationId}, ${input.userId}, ${input.role}, ${now}, ${now})
    `
    return 'created'
  }

  if (existing[0]?.role === input.role) {
    return 'unchanged'
  }

  await db.$executeRaw`
    UPDATE "member"
    SET "role" = ${input.role}, "updatedAt" = ${new Date()}
    WHERE "id" = ${existing[0]?.id ?? ''}
  `

  return 'updated'
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
  let createdOrganizations = 0
  let memberUpserts = 0
  let skippedMissingTables = 0
  let pendingOrganization = 0

  const organizationTableAvailable = await hasTable(db, 'organization')
  const memberTableAvailable = await hasTable(db, 'member')

  if (!organizationTableAvailable) {
    process.stdout.write(
      '[SKIP] Better Auth organization table is missing. Run `npx auth migrate` before non-dry migration.\n'
    )
  }

  if (!memberTableAvailable) {
    process.stdout.write(
      '[SKIP] Better Auth member table is missing. Run `npx auth migrate` before non-dry migration.\n'
    )
  }

  for (const wedding of weddings) {
    if (wedding.organizationId) {
      alreadyLinked += 1
      continue
    }

    const slug = buildWeddingOrganizationSlug(wedding.id)
    let organizationId = organizationTableAvailable
      ? await findOrganizationIdBySlug(db, slug)
      : null

    if (!organizationId) {
      if (!organizationTableAvailable) {
        pendingOrganization += 1
        skippedMissingTables += 1
        process.stdout.write(
          `[PENDING_ORG_TABLE] wedding=${wedding.id} slug=${slug} members=${wedding.userWeddings.length}\n`
        )
        continue
      }

      const organizationName = `${wedding.groomFirstName} & ${wedding.brideFirstName}`
      if (!args.dryRun) {
        organizationId = await createOrganization(db, {
          weddingId: wedding.id,
          name: organizationName,
        })
      } else {
        organizationId = `dry-run-org-for-${wedding.id}`
      }

      createdOrganizations += 1

      process.stdout.write(
        `[CREATE_ORG] wedding=${wedding.id} slug=${slug} org=${organizationId} dryRun=${String(args.dryRun)}\n`
      )
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
      const mappedRole = mapLegacyRole(member.role)

      if (memberTableAvailable) {
        if (!args.dryRun) {
          const action = await ensureMemberRole(db, {
            organizationId,
            userId: member.userId,
            role: mappedRole,
          })

          if (action !== 'unchanged') {
            memberUpserts += 1
          }
        } else {
          memberUpserts += 1
        }
      } else {
        skippedMissingTables += 1
      }

      process.stdout.write(
        `[MEMBER_PLAN] wedding=${wedding.id} org=${organizationId} user=${member.userId} role=${mappedRole} dryRun=${String(args.dryRun)}\n`
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
      `- organizationsCreated: ${createdOrganizations}`,
      `- memberUpserts: ${memberUpserts}`,
      `- pendingOrganization: ${pendingOrganization}`,
      `- skippedMissingTables: ${skippedMissingTables}`,
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
