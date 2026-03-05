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

export const PLACEHOLDER_TASKS: TaskItem[] = [
  { id: '1', text: 'Book ceremony venue', tag: 'Vendor', due: 'Done', done: true, urgent: false },
  {
    id: '2',
    text: 'Finalise guest list (first pass)',
    tag: 'Admin',
    due: 'Done',
    done: true,
    urgent: false,
  },
  {
    id: '3',
    text: 'Confirm catering headcount',
    tag: 'Urgent',
    due: 'This week',
    done: false,
    urgent: true,
  },
  {
    id: '4',
    text: 'Pay rehearsal dinner deposit',
    tag: 'Overdue',
    due: 'Overdue',
    done: false,
    urgent: true,
  },
  {
    id: '5',
    text: 'Book hair & makeup artist',
    tag: 'Vendor',
    due: 'Mar 20',
    done: false,
    urgent: false,
  },
  {
    id: '6',
    text: 'Finalise ceremony music playlist',
    tag: 'Admin',
    due: 'Apr 1',
    done: false,
    urgent: false,
  },
]

export function useTasksCardState() {
  const [tasks, setTasks] = useState<TaskItem[]>(PLACEHOLDER_TASKS)

  const toggleTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task))
    )
  }, [])

  return { tasks, toggleTask }
}
