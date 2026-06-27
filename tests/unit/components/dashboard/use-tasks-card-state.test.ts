import { act, renderHook } from '@testing-library/react'

import {
  useTasksCardState,
  type TaskItem,
} from '~/components/dashboard/planning-overview/use-tasks-card-state'

describe('useTasksCardState', () => {
  it('initializes with an empty task list', () => {
    const { result } = renderHook(() => useTasksCardState())
    expect(result.current.tasks).toEqual([])
  })

  it('exposes a toggleTask function', () => {
    const { result } = renderHook(() => useTasksCardState())
    expect(typeof result.current.toggleTask).toBe('function')
  })

  it('toggles done state for a task when one exists', () => {
    const { result } = renderHook(() => useTasksCardState())

    const task: TaskItem = {
      id: 'test-1',
      text: 'Test task',
      tag: 'Admin',
      due: 'Today',
      done: false,
      urgent: false,
    }

    act(() => {
      result.current.setTasks([task])
    })

    act(() => {
      result.current.toggleTask('test-1')
    })

    expect(result.current.tasks.find((t) => t.id === 'test-1')?.done).toBe(true)
  })

  it('does not affect other tasks when toggling one', () => {
    const { result } = renderHook(() => useTasksCardState())

    const tasks: TaskItem[] = [
      { id: 'a', text: 'Task A', tag: 'Admin', due: 'Today', done: false, urgent: false },
      { id: 'b', text: 'Task B', tag: 'Vendor', due: 'Tomorrow', done: false, urgent: false },
    ]

    act(() => {
      result.current.setTasks(tasks)
    })

    act(() => {
      result.current.toggleTask('a')
    })

    expect(result.current.tasks.find((t) => t.id === 'a')?.done).toBe(true)
    expect(result.current.tasks.find((t) => t.id === 'b')?.done).toBe(false)
  })
})
