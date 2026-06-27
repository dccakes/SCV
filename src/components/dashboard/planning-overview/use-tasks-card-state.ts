'use client'

import { useCallback, useState } from 'react'

export type TaskItem = {
  id: string
  text: string
  tag: string
  due: string
  done: boolean
  urgent: boolean
}

export const PLACEHOLDER_TASKS: TaskItem[] = []

export function useTasksCardState() {
  const [tasks, setTasks] = useState<TaskItem[]>(PLACEHOLDER_TASKS)

  const toggleTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task))
    )
  }, [])

  return { tasks, setTasks, toggleTask }
}
