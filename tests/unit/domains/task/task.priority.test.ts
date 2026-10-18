import { mockTask } from '~/server/domains/task/__mocks__/task.repository'
import { buildTaskPriorityQueue, countTasksDueThisMonth } from '~/server/domains/task/task.priority'
import type { Task } from '~/server/domains/task/task.types'

const now = new Date('2026-10-18T12:00:00.000Z')
const weddingDate = new Date('2027-04-10T00:00:00.000Z')

const undatedTask = (id: string, monthsBeforeWedding: number): Task => ({
  ...mockTask,
  id,
  dueDate: null,
  monthsBeforeWedding,
})

describe('task priority with a wedding date', () => {
  it('derives target dates and ranks overdue lead-time tasks first', () => {
    const result = buildTaskPriorityQueue(
      [undatedTask('one-month', 1), undatedTask('twelve-months', 12), undatedTask('six-months', 6)],
      weddingDate,
      now
    )

    expect(result.tasks.map((task) => task.id)).toEqual([
      'twelve-months',
      'six-months',
      'one-month',
    ])
    expect(result.tasks[0]?.targetDate).toEqual(new Date('2026-04-10T00:00:00.000Z'))
  })

  it('counts overdue and this-month tasks but not far-off day-of tasks', () => {
    const count = countTasksDueThisMonth(
      [
        undatedTask('overdue', 12),
        undatedTask('this-month', 6),
        undatedTask('later', 3),
        undatedTask('day-of', 0),
      ],
      weddingDate,
      now
    )

    // 12 months before = Apr 2026 (overdue), 6 months before = Oct 2026 (this month).
    expect(count).toBe(2)
  })

  it('only counts explicit due dates when no wedding date is known', () => {
    const count = countTasksDueThisMonth(
      [
        undatedTask('day-of', 0),
        { ...mockTask, id: 'due', dueDate: new Date('2026-10-20T00:00:00.000Z') },
      ],
      null,
      now
    )

    expect(count).toBe(1)
  })
})
