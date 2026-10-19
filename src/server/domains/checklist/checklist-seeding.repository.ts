/**
 * Checklist Domain - Seeding Repository
 *
 * Database access for seeding a wedding's canonical milestones and tasks.
 * Accepts a transaction client so seeding can join a caller's unit of work.
 */

import type { Prisma, PrismaClient } from '@prisma/client'

type DbClient = PrismaClient | Prisma.TransactionClient

export type MilestoneSeedRow = Omit<Prisma.MilestoneCreateManyInput, 'id'>
export type TaskSeedRow = Omit<Prisma.TaskCreateManyInput, 'id'>

export class ChecklistSeedingRepository {
  constructor(private db: DbClient) {}

  /** `null` when the wedding does not exist; otherwise its earliest event id (or null). */
  async findFirstEventId(weddingId: string): Promise<{ firstEventId: string | null } | null> {
    const wedding = await this.db.wedding.findUnique({
      where: { id: weddingId },
      select: {
        events: {
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          take: 1,
          select: { id: true },
        },
      },
    })
    if (!wedding) return null
    return { firstEventId: wedding.events[0]?.id ?? null }
  }

  /** Adds the `tasks` add-on if missing. Returns true when it was added. */
  async enableTasksAddOn(weddingId: string): Promise<boolean> {
    const result = await this.db.wedding.updateMany({
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
    return result.count > 0
  }

  async insertMilestones(rows: MilestoneSeedRow[]): Promise<number> {
    const result = await this.db.milestone.createMany({ data: rows, skipDuplicates: true })
    return result.count
  }

  async findMilestoneIdsByKey(
    weddingId: string,
    keys: string[]
  ): Promise<Array<{ id: string; key: string }>> {
    return this.db.milestone.findMany({
      where: {
        weddingId,
        key: { in: keys },
      },
      select: { id: true, key: true },
    })
  }

  async insertTasks(rows: TaskSeedRow[]): Promise<number> {
    const result = await this.db.task.createMany({ data: rows, skipDuplicates: true })
    return result.count
  }
}
