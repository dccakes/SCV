'use client'

import { useCallback, useEffect, useState } from 'react'

import type { TaskCategoryValue } from '~/lib/constants/task-categories'
import { TASK_CATEGORY_LABELS } from '~/lib/constants/task-categories'
import type { Task } from '~/server/domains/task'

const EMPTY_TASKS: Task[] = []

export type TaskItem = {
  id: string
  text: string
  tag: string
  due: string
  done: boolean
  urgent: boolean
}

export function useTasksCardState(priorityTasks: Task[] = EMPTY_TASKS) {
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

export function createTaskCardItems(tasks: Task[], now: Date = new Date()): TaskItem[] {
  return tasks.map((task) => ({
    id: task.id,
    text: task.title,
    tag: getTaskTag(task.category, task.dueDate, task.completed, now),
    due: getTaskDueLabel(task, now),
    done: task.completed,
    urgent: isUrgentTask(task, now),
  }))
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

const getTaskDueLabel = (task: Task, now: Date): string => {
  if (task.completed) {
    return 'Done'
  }

  if (task.dueDate) {
    const today = startOfUtcDay(now)
    const normalizedDueDate = startOfUtcDay(task.dueDate)
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

const isUrgentTask = (task: Task, now: Date): boolean => {
  if (!task.dueDate || task.completed) {
    return false
  }

  const today = startOfUtcDay(now)
  const normalizedDueDate = startOfUtcDay(task.dueDate)
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
