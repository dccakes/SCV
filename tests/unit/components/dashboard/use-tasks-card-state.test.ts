import { act, renderHook } from '@testing-library/react'

import {
  createTaskCardItems,
  useTasksCardState,
} from '~/components/dashboard/planning-overview/use-tasks-card-state'

describe('useTasksCardState', () => {
  it('toggles done state for one task without changing others', () => {
    const priorityTasks = [
      {
        id: 'task-1',
        weddingId: 'wedding-1',
        eventId: 'event-1',
        vendorId: null,
        milestoneId: null,
        seedKey: null,
        title: 'Confirm catering headcount',
        category: 'RECEPTION',
        monthsBeforeWedding: 0,
        dueDate: new Date('2026-04-29T00:00:00.000Z'),
        description: null,
        notes: null,
        isDefault: false,
        position: 0,
        completed: false,
        completedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
      {
        id: 'task-2',
        weddingId: 'wedding-1',
        eventId: 'event-1',
        vendorId: null,
        milestoneId: null,
        seedKey: null,
        title: 'Order flowers',
        category: 'VENDORS',
        monthsBeforeWedding: 6,
        dueDate: null,
        description: null,
        notes: null,
        isDefault: false,
        position: 1,
        completed: false,
        completedAt: null,
        createdAt: new Date('2026-01-03T00:00:00.000Z'),
        updatedAt: new Date('2026-01-04T00:00:00.000Z'),
      },
    ] as Parameters<typeof useTasksCardState>[0]

    const { result } = renderHook(() => useTasksCardState(priorityTasks))

    const before = result.current.tasks
    const targetId = before[0]?.id

    if (!targetId) {
      throw new Error('Expected a first task')
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

    expect(after[1]).toBe(before[1])
  })

  it('maps real tasks into card labels and urgency', () => {
    const items = createTaskCardItems(
      [
        {
          id: 'task-1',
          weddingId: 'wedding-1',
          eventId: 'event-1',
          vendorId: null,
          milestoneId: null,
          seedKey: null,
          title: 'Follow up with venue',
          category: 'VENUE',
          monthsBeforeWedding: 6,
          dueDate: new Date('2026-04-20T00:00:00.000Z'),
          description: null,
          notes: null,
          isDefault: false,
          position: 0,
          completed: false,
          completedAt: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        },
      ] as Parameters<typeof useTasksCardState>[0],
      new Date('2026-04-27T12:00:00.000Z')
    )

    expect(items[0]).toEqual({
      id: 'task-1',
      text: 'Follow up with venue',
      tag: 'Overdue',
      due: 'Overdue',
      done: false,
      urgent: true,
    })
  })
})
