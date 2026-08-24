import type { Task, TaskPriorityQueueResult } from '~/server/domains/task/task.types'

export function buildTaskPriorityQueue(
  tasks: Task[],
  now: Date = new Date(),
  limit = 6
): TaskPriorityQueueResult {
  const rankedTasks = [...tasks].sort((left, right) => comparePriorityTasks(left, right, now))

  return {
    tasks: rankedTasks.slice(0, limit),
    totalActive: tasks.length,
  }
}

export function countTasksDueThisMonth(tasks: Task[], now: Date = new Date()): number {
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))

  return tasks.filter((task) => {
    if (task.dueDate) {
      const dueDate = startOfUtcDay(task.dueDate)
      return dueDate >= monthStart && dueDate < monthEnd
    }

    return task.monthsBeforeWedding === 0
  }).length
}

const comparePriorityTasks = (left: Task, right: Task, now: Date): number => {
  const today = startOfUtcDay(now)
  const weekEnd = endOfUtcWeek(today)
  const leftBucket = getPriorityBucket(left, today, weekEnd)
  const rightBucket = getPriorityBucket(right, today, weekEnd)

  if (leftBucket !== rightBucket) {
    return leftBucket - rightBucket
  }

  if (leftBucket === 2 && left.monthsBeforeWedding !== right.monthsBeforeWedding) {
    return right.monthsBeforeWedding - left.monthsBeforeWedding
  }

  if (left.dueDate && right.dueDate) {
    const dueDifference =
      startOfUtcDay(left.dueDate).getTime() - startOfUtcDay(right.dueDate).getTime()
    if (dueDifference !== 0) {
      return dueDifference
    }
  } else if (left.dueDate || right.dueDate) {
    return left.dueDate ? -1 : 1
  } else if (left.monthsBeforeWedding !== right.monthsBeforeWedding) {
    return left.monthsBeforeWedding - right.monthsBeforeWedding
  }

  if (left.position !== right.position) {
    return left.position - right.position
  }

  return left.createdAt.getTime() - right.createdAt.getTime()
}

const getPriorityBucket = (task: Task, today: Date, weekEnd: Date): number => {
  if (!task.dueDate) {
    return 2
  }

  const dueDate = startOfUtcDay(task.dueDate)
  if (dueDate < today) {
    return 0
  }

  if (dueDate <= weekEnd) {
    return 1
  }

  return 2
}

const startOfUtcDay = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

const endOfUtcWeek = (date: Date): Date => {
  const end = startOfUtcDay(date)
  const daysUntilSunday = (7 - end.getUTCDay()) % 7
  end.setUTCDate(end.getUTCDate() + daysUntilSunday)
  return end
}
