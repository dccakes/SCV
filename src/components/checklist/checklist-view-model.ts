import { TASK_CATEGORIES, type TaskCategoryValue } from '~/lib/constants/task-categories'

import type { MilestoneWithEffectiveStatus } from '~/server/domains/milestone'
import type { Task } from '~/server/domains/task'

export type ChecklistStatusFilter = 'active' | 'completed' | 'all'

export type ChecklistFilters = {
  category: TaskCategoryValue | 'all'
  eventId: string | 'all'
  status: ChecklistStatusFilter
}

export type TaskBucketKey =
  | 'this-week'
  | 'this-month'
  | 'three-months'
  | 'six-months'
  | 'nine-plus-months'
  | 'day-of'
  | 'done'

export type TaskBucket = {
  key: TaskBucketKey
  title: string
  tasks: Task[]
}

const TASK_BUCKET_ORDER: Array<Pick<TaskBucket, 'key' | 'title'>> = [
  { key: 'this-week', title: 'This week' },
  { key: 'this-month', title: 'This month' },
  { key: 'three-months', title: '3 months' },
  { key: 'six-months', title: '6 months' },
  { key: 'nine-plus-months', title: '9+ months' },
  { key: 'day-of', title: 'Day of' },
  { key: 'done', title: 'Done' },
]

export function getChecklistFiltersFromSearchParams(
  searchParams: URLSearchParams
): ChecklistFilters {
  const category = searchParams.get('category')
  const status = searchParams.get('status')
  const eventId = searchParams.get('eventId')

  return {
    category: isTaskCategory(category) ? category : 'all',
    eventId: eventId && eventId.length > 0 ? eventId : 'all',
    status: status === 'active' || status === 'completed' ? status : 'all',
  }
}

export function filterTasks(tasks: Task[], filters: ChecklistFilters): Task[] {
  return tasks.filter((task) => {
    if (filters.category !== 'all' && task.category !== filters.category) {
      return false
    }

    if (filters.eventId !== 'all' && task.eventId !== filters.eventId) {
      return false
    }

    if (filters.status === 'active' && task.completed) {
      return false
    }

    if (filters.status === 'completed' && !task.completed) {
      return false
    }

    return true
  })
}

export function bucketTasks(tasks: Task[], now: Date = new Date()): TaskBucket[] {
  const grouped = new Map<TaskBucketKey, Task[]>()

  for (const task of tasks) {
    const bucketKey = getTaskBucketKey(task, now)
    const bucketTasks = grouped.get(bucketKey) ?? []
    bucketTasks.push(task)
    grouped.set(bucketKey, bucketTasks)
  }

  return TASK_BUCKET_ORDER.map((bucket) => ({
    ...bucket,
    tasks: [...(grouped.get(bucket.key) ?? [])].sort((left, right) =>
      compareBucketTasks(left, right, now)
    ),
  }))
}

export function hasMilestoneOverrideDivergence(milestone: MilestoneWithEffectiveStatus): boolean {
  return (
    milestone.userOverrideStatus !== null && milestone.effectiveStatus !== milestone.derivedStatus
  )
}

function getTaskBucketKey(task: Task, now: Date): TaskBucketKey {
  if (task.completed) {
    return 'done'
  }

  if (task.dueDate) {
    const dueDate = startOfUtcDay(task.dueDate)
    const today = startOfUtcDay(now)
    const weekEnd = endOfUtcWeek(today)
    const monthEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1))

    if (dueDate <= weekEnd) {
      return 'this-week'
    }

    if (dueDate < monthEnd) {
      return 'this-month'
    }
  }

  if (task.monthsBeforeWedding <= 0) {
    return 'day-of'
  }

  if (task.monthsBeforeWedding <= 3) {
    return 'three-months'
  }

  if (task.monthsBeforeWedding <= 6) {
    return 'six-months'
  }

  return 'nine-plus-months'
}

function compareBucketTasks(left: Task, right: Task, now: Date): number {
  if (left.dueDate && right.dueDate) {
    const dueDateDifference =
      startOfUtcDay(left.dueDate).getTime() - startOfUtcDay(right.dueDate).getTime()
    if (dueDateDifference !== 0) {
      return dueDateDifference
    }
  } else if (left.dueDate || right.dueDate) {
    return left.dueDate ? -1 : 1
  }

  if (left.completedAt && right.completedAt) {
    return right.completedAt.getTime() - left.completedAt.getTime()
  }

  if (left.monthsBeforeWedding !== right.monthsBeforeWedding) {
    return left.monthsBeforeWedding - right.monthsBeforeWedding
  }

  if (left.position !== right.position) {
    return left.position - right.position
  }

  return left.createdAt.getTime() - right.createdAt.getTime() + now.getTime() * 0
}

function isTaskCategory(value: string | null): value is TaskCategoryValue {
  return value !== null && TASK_CATEGORIES.includes(value as TaskCategoryValue)
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function endOfUtcWeek(date: Date): Date {
  const end = startOfUtcDay(date)
  const daysUntilSunday = (7 - end.getUTCDay()) % 7
  end.setUTCDate(end.getUTCDate() + daysUntilSunday)
  return end
}
