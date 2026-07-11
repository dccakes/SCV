// biome-ignore lint/style/noRestrictedImports: cross-domain seeding requires direct Prisma access
import type { Prisma, PrismaClient } from '@prisma/client'

import {
  type CanonicalMilestoneKey,
  getCanonicalMilestoneSeed,
} from '~/server/domains/milestone/milestone.seed'
import { getCanonicalTaskSeed } from '~/server/domains/task/task.seed'

type DbClient = PrismaClient | Prisma.TransactionClient

export type ChecklistSeedResult = {
  eventId: string | null
  seededMilestoneCount: number
  seededTaskCount: number
  enabledAddOnsUpdated: boolean
}

export class ChecklistSeedingService {
  constructor(private db: DbClient) {}

  async ensureSeeded(
    weddingId: string,
    dbClient: DbClient = this.db
  ): Promise<ChecklistSeedResult> {
    const wedding = await dbClient.wedding.findUnique({
      where: { id: weddingId },
      select: {
        events: {
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          take: 1,
          select: { id: true },
        },
      },
    })

    if (!wedding) {
      throw new Error(`Cannot seed checklist for missing wedding ${weddingId}`)
    }

    const firstEvent = wedding.events[0]
    if (!firstEvent) {
      return {
        eventId: null,
        seededMilestoneCount: 0,
        seededTaskCount: 0,
        enabledAddOnsUpdated: false,
      }
    }

    const enabledAddOnsResult = await dbClient.wedding.updateMany({
      where: {
        id: weddingId,
        NOT: {
          enabledAddOns: {
            has: 'tasks',
          },
        },
      },
      data: {
        enabledAddOns: {
          push: 'tasks',
        },
      },
    })
    const enabledAddOnsUpdated = enabledAddOnsResult.count > 0

    const milestoneSeed = getCanonicalMilestoneSeed()
    const milestoneInsert = await dbClient.milestone.createMany({
      data: milestoneSeed.map((milestone) => ({
        weddingId,
        key: milestone.key,
        title: milestone.title,
        category: milestone.category,
        position: milestone.position,
        targetDate: null,
      })),
      skipDuplicates: true,
    })

    const milestoneRows = await dbClient.milestone.findMany({
      where: {
        weddingId,
        key: { in: milestoneSeed.map((milestone) => milestone.key) },
      },
      select: { id: true, key: true },
    })

    const milestoneIdByKey = new Map<CanonicalMilestoneKey, string>(
      milestoneRows.map((milestone) => [milestone.key as CanonicalMilestoneKey, milestone.id])
    )

    const taskInsert = await dbClient.task.createMany({
      data: getCanonicalTaskSeed().map((task) => ({
        weddingId,
        eventId: firstEvent.id,
        milestoneId: task.milestoneKey
          ? requireMilestoneId(milestoneIdByKey, task.milestoneKey, weddingId)
          : null,
        seedKey: task.seedKey,
        title: task.title,
        category: task.category,
        monthsBeforeWedding: task.monthsBeforeWedding,
        dueDate: null,
        isDefault: true,
        position: task.position,
        completed: false,
        completedAt: null,
      })),
      skipDuplicates: true,
    })

    return {
      eventId: firstEvent.id,
      seededMilestoneCount: milestoneInsert.count,
      seededTaskCount: taskInsert.count,
      enabledAddOnsUpdated,
    }
  }
}

const requireMilestoneId = (
  milestoneIdByKey: Map<CanonicalMilestoneKey, string>,
  milestoneKey: CanonicalMilestoneKey,
  weddingId: string
): string => {
  const milestoneId = milestoneIdByKey.get(milestoneKey)
  if (milestoneId) {
    return milestoneId
  }

  throw new Error(
    `Missing milestone ${milestoneKey} while seeding checklist tasks for wedding ${weddingId}`
  )
}
