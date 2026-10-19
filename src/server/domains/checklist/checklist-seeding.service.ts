import type { ChecklistSeedingRepository } from '~/server/domains/checklist/checklist-seeding.repository'
import {
  type CanonicalMilestoneKey,
  getCanonicalMilestoneSeed,
} from '~/server/domains/milestone/milestone.seed'
import { getCanonicalTaskSeed } from '~/server/domains/task/task.seed'

export type ChecklistSeedResult = {
  eventId: string | null
  seededMilestoneCount: number
  seededTaskCount: number
  enabledAddOnsUpdated: boolean
}

export class ChecklistSeedingService {
  constructor(private repository: ChecklistSeedingRepository) {}

  /**
   * Idempotently seed canonical milestones and tasks against the wedding's
   * first event. Pass a transaction-bound repository to join a unit of work.
   */
  async ensureSeeded(
    weddingId: string,
    repository: ChecklistSeedingRepository = this.repository
  ): Promise<ChecklistSeedResult> {
    const wedding = await repository.findFirstEventId(weddingId)

    if (!wedding) {
      throw new Error(`Cannot seed checklist for missing wedding ${weddingId}`)
    }

    const firstEventId = wedding.firstEventId
    if (!firstEventId) {
      return {
        eventId: null,
        seededMilestoneCount: 0,
        seededTaskCount: 0,
        enabledAddOnsUpdated: false,
      }
    }

    const enabledAddOnsUpdated = await repository.enableTasksAddOn(weddingId)

    const milestoneSeed = getCanonicalMilestoneSeed()
    const seededMilestoneCount = await repository.insertMilestones(
      milestoneSeed.map((milestone) => ({
        weddingId,
        key: milestone.key,
        title: milestone.title,
        category: milestone.category,
        position: milestone.position,
        targetDate: null,
      }))
    )

    const milestoneRows = await repository.findMilestoneIdsByKey(
      weddingId,
      milestoneSeed.map((milestone) => milestone.key)
    )

    const milestoneIdByKey = new Map<CanonicalMilestoneKey, string>(
      milestoneRows.map((milestone) => [milestone.key as CanonicalMilestoneKey, milestone.id])
    )

    const seededTaskCount = await repository.insertTasks(
      getCanonicalTaskSeed().map((task) => ({
        weddingId,
        eventId: firstEventId,
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
      }))
    )

    return {
      eventId: firstEventId,
      seededMilestoneCount,
      seededTaskCount,
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
