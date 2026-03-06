import { act, renderHook } from '@testing-library/react'

import { useTasksCardState } from '~/components/dashboard/planning-overview/use-tasks-card-state'

describe('useTasksCardState', () => {
  it('toggles done state for one task without changing others', () => {
    const { result } = renderHook(() => useTasksCardState())

    const before = result.current.tasks
    const targetId = before[2]?.id

    if (!targetId) {
      throw new Error('Expected a third placeholder task')
    }

    act(() => {
      result.current.toggleTask(targetId)
    })

    const after = result.current.tasks
    expect(after).toHaveLength(before.length)

    const targetBefore = before.find((task) => task.id === targetId)
    const targetAfter = after.find((task) => task.id === targetId)

    expect(targetBefore?.done).toBe(false)
    expect(targetAfter?.done).toBe(true)

    expect(after[0]).toBe(before[0])
  })
})
