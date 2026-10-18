'use client'

import { useCallback, useEffect, useState } from 'react'

import type { TaskCategoryValue } from '~/lib/constants/task-categories'
import { TASK_CATEGORY_LABELS } from '~/lib/constants/task-categories'
import type { Task } from '~/server/domains/task'

// The priority queue adds targetDate; plain tasks fall back to their explicit due date.
type CardTask = Task & { targetDate?: Date | null }

const EMPTY_TASKS: CardTask[] = []

export type TaskItem = {
  id: string
  text: string
  tag: string
  due: string
  done: boolean
  urgent: boolean
}

export function useTasksCardState(priorityTasks: CardTask[] = EMPTY_TASKS) {
  const [tasks, setTasks] = useState<TaskItem[]>(() => createTaskCardItems(priorityTasks))

  useEffect(() => {
    setTasks(createTaskCardItems(priorityTasks))
  }, [priorityTasks])

  const toggleTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task))
    )
  }, [])

  return { tasks, setTasks, toggleTask }
}

export function createTaskCardItems(tasks: CardTask[], now: Date = new Date()): TaskItem[] {
  return tasks.map((task) => {
    const targetDate = task.targetDate ?? task.dueDate

    return {
      id: task.id,
      text: task.title,
      tag: getTaskTag(task.category, targetDate, task.completed, now),
      due: getTaskDueLabel(task, targetDate, now),
      done: task.completed,
      urgent: isUrgentTask(targetDate, task.completed, now),
    }
  })
}

const getTaskTag = (
  category: TaskCategoryValue,
  dueDate: Date | null,
  completed: boolean,
  now: Date
): string => {
  if (completed) {
    return 'Done'
  }

  if (dueDate) {
    const today = startOfUtcDay(now)
    const normalizedDueDate = startOfUtcDay(dueDate)
    if (normalizedDueDate < today) {
      return 'Overdue'
    }

    if (normalizedDueDate <= endOfUtcWeek(today)) {
      return 'Urgent'
    }
  }

  return TASK_CATEGORY_LABELS[category] ?? 'Task'
}

const getTaskDueLabel = (task: Task, targetDate: Date | null, now: Date): string => {
  if (task.completed) {
    return 'Done'
  }

  if (targetDate) {
    const today = startOfUtcDay(now)
    const normalizedDueDate = startOfUtcDay(targetDate)
    if (normalizedDueDate < today) {
      return 'Overdue'
    }

    if (normalizedDueDate <= endOfUtcWeek(today)) {
      return 'This week'
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(normalizedDueDate)
  }

  if (task.monthsBeforeWedding === 0) {
    return 'Day of'
  }

  return `${task.monthsBeforeWedding} mo`
}

const isUrgentTask = (targetDate: Date | null, completed: boolean, now: Date): boolean => {
  if (!targetDate || completed) {
    return false
  }

  const today = startOfUtcDay(now)
  const normalizedDueDate = startOfUtcDay(targetDate)
  return normalizedDueDate <= endOfUtcWeek(today)
}

const startOfUtcDay = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

const endOfUtcWeek = (date: Date): Date => {
  const end = startOfUtcDay(date)
  const daysUntilSunday = (7 - end.getUTCDay()) % 7
  end.setUTCDate(end.getUTCDate() + daysUntilSunday)
  return end
}
