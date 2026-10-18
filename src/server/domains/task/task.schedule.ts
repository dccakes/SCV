import type { Task } from '~/server/domains/task/task.types'

// Explicit due dates win; otherwise the target is the wedding date minus the task's lead time.
export function getTaskTargetDate(
  task: Pick<Task, 'dueDate' | 'monthsBeforeWedding'>,
  weddingDate: Date | null
): Date | null {
  if (task.dueDate) {
    return startOfUtcDay(task.dueDate)
  }

  if (!weddingDate) {
    return null
  }

  const wedding = startOfUtcDay(weddingDate)
  return new Date(
    Date.UTC(
      wedding.getUTCFullYear(),
      wedding.getUTCMonth() - task.monthsBeforeWedding,
      wedding.getUTCDate()
    )
  )
}

export const startOfUtcDay = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

export const endOfUtcWeek = (date: Date): Date => {
  const end = startOfUtcDay(date)
  const daysUntilSunday = (7 - end.getUTCDay()) % 7
  end.setUTCDate(end.getUTCDate() + daysUntilSunday)
  return end
}
