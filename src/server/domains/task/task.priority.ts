import { endOfUtcWeek, getTaskTargetDate, startOfUtcDay } from '~/server/domains/task/task.schedule'
import type { PriorityTask, Task, TaskPriorityQueueResult } from '~/server/domains/task/task.types'

export function buildTaskPriorityQueue(
  tasks: Task[],
  weddingDate: Date | null = null,
  now: Date = new Date(),
  limit = 6
): TaskPriorityQueueResult {
  const rankedTasks = tasks
    .map((task) => ({ ...task, targetDate: getTaskTargetDate(task, weddingDate) }))
    .sort((left, right) => comparePriorityTasks(left, right, now))

  return {
    tasks: rankedTasks.slice(0, limit),
    totalActive: tasks.length,
  }
}

// Overdue tasks count too: they still need doing this month.
export function countTasksDueThisMonth(
  tasks: Task[],
  weddingDate: Date | null = null,
  now: Date = new Date()
): number {
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))

  return tasks.filter((task) => {
    const targetDate = getTaskTargetDate(task, weddingDate)
    return targetDate !== null && targetDate < monthEnd
  }).length
}

const comparePriorityTasks = (left: PriorityTask, right: PriorityTask, now: Date): number => {
  const today = startOfUtcDay(now)
  const weekEnd = endOfUtcWeek(today)
  const leftBucket = getPriorityBucket(left, today, weekEnd)
  const rightBucket = getPriorityBucket(right, today, weekEnd)

  if (leftBucket !== rightBucket) {
    return leftBucket - rightBucket
  }

  // Without a wedding date undated tasks have no target, so rank by lead time first.
  const hasUndated = !left.targetDate || !right.targetDate
  if (leftBucket === 2 && hasUndated && left.monthsBeforeWedding !== right.monthsBeforeWedding) {
    return right.monthsBeforeWedding - left.monthsBeforeWedding
  }

  if (left.targetDate && right.targetDate) {
    const targetDifference = left.targetDate.getTime() - right.targetDate.getTime()
    if (targetDifference !== 0) {
      return targetDifference
    }
  } else if (left.targetDate || right.targetDate) {
    return left.targetDate ? -1 : 1
  }

  if (left.position !== right.position) {
    return left.position - right.position
  }

  return left.createdAt.getTime() - right.createdAt.getTime()
}

const getPriorityBucket = (task: PriorityTask, today: Date, weekEnd: Date): number => {
  if (!task.targetDate) {
    return 2
  }

  if (task.targetDate < today) {
    return 0
  }

  if (task.targetDate <= weekEnd) {
    return 1
  }

  return 2
}
