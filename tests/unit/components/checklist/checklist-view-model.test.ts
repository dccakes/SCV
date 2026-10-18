import { TaskCategory } from '@prisma/client'
import {
  bucketTasks,
  filterTasks,
  getChecklistFiltersFromSearchParams,
  getCompletionPercent,
  groupBucketsIntoHorizons,
  hasMilestoneOverrideDivergence,
} from '~/components/checklist/checklist-view-model'
import type { MilestoneWithEffectiveStatus } from '~/server/domains/milestone'
import type { Task } from '~/server/domains/task'

const baseTask: Task = {
  id: 'task-1',
  weddingId: 'wedding-1',
  eventId: 'event-1',
  vendorId: null,
  milestoneId: null,
  seedKey: null,
  title: 'Base task',
  category: TaskCategory.OTHER,
  monthsBeforeWedding: 6,
  dueDate: null,
  description: null,
  notes: null,
  isDefault: false,
  position: 0,
  completed: false,
  completedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

const baseMilestone: MilestoneWithEffectiveStatus = {
  id: 'milestone-1',
  weddingId: 'wedding-1',
  key: 'venue_booked',
  title: 'Venue booked',
  category: 'VENDORS',
  position: 2,
  targetDate: null,
  userOverrideStatus: null,
  attestedAt: null,
  dismissedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  derivedStatus: 'pending',
  effectiveStatus: 'pending',
}

describe('checklist-view-model', () => {
  it('parses filter defaults from search params', () => {
    const filters = getChecklistFiltersFromSearchParams(new URLSearchParams())

    expect(filters).toEqual({
      category: 'all',
      eventId: 'all',
      status: 'all',
    })
  })

  it('filters tasks by category, event, and status', () => {
    const tasks: Task[] = [
      { ...baseTask, id: 'task-legal', category: TaskCategory.LEGAL },
      { ...baseTask, id: 'task-other-event', eventId: 'event-2', category: TaskCategory.LEGAL },
      { ...baseTask, id: 'task-done', category: TaskCategory.LEGAL, completed: true },
    ]

    const filtered = filterTasks(tasks, {
      category: TaskCategory.LEGAL,
      eventId: 'event-1',
      status: 'active',
    })

    expect(filtered.map((task) => task.id)).toEqual(['task-legal'])
  })

  it('buckets tasks by due date before monthsBeforeWedding fallback', () => {
    const tasks: Task[] = [
      {
        ...baseTask,
        id: 'task-this-week',
        monthsBeforeWedding: 9,
        dueDate: new Date('2026-04-30T00:00:00.000Z'),
      },
      {
        ...baseTask,
        id: 'task-three-months',
        monthsBeforeWedding: 3,
      },
      {
        ...baseTask,
        id: 'task-done',
        completed: true,
        completedAt: new Date('2026-04-20T00:00:00.000Z'),
      },
    ]

    const buckets = bucketTasks(tasks, new Date('2026-04-27T00:00:00.000Z'))

    expect(
      buckets.find((bucket) => bucket.key === 'this-week')?.tasks.map((task) => task.id)
    ).toEqual(['task-this-week'])
    expect(
      buckets.find((bucket) => bucket.key === 'three-months')?.tasks.map((task) => task.id)
    ).toEqual(['task-three-months'])
    expect(buckets.find((bucket) => bucket.key === 'done')?.tasks.map((task) => task.id)).toEqual([
      'task-done',
    ])
  })

  it('buckets tasks by distance to their target date when the wedding date is known', () => {
    const now = new Date('2026-10-18T12:00:00.000Z')
    const weddingDate = new Date('2027-04-10T00:00:00.000Z')
    const tasks: Task[] = [
      { ...baseTask, id: 'overdue-12', monthsBeforeWedding: 12 },
      { ...baseTask, id: 'overdue-9', monthsBeforeWedding: 9 },
      { ...baseTask, id: 'next-4', monthsBeforeWedding: 4 },
      { ...baseTask, id: 'later-1', monthsBeforeWedding: 1 },
      { ...baseTask, id: 'dayof', monthsBeforeWedding: 0 },
      {
        ...baseTask,
        id: 'explicit-due',
        monthsBeforeWedding: 1,
        dueDate: new Date('2026-10-28T00:00:00.000Z'),
      },
    ]

    const buckets = bucketTasks(tasks, now, weddingDate)
    const idsFor = (key: string) =>
      buckets.find((bucket) => bucket.key === key)?.tasks.map((task) => task.id)

    // Wedding is ~6 months out, so 12 and 9 month tasks are overdue and belong in Now.
    expect(idsFor('this-week')).toEqual(['overdue-12', 'overdue-9'])
    expect(idsFor('this-month')).toEqual(['explicit-due'])
    expect(idsFor('three-months')).toEqual(['next-4'])
    expect(idsFor('six-months')).toEqual(['later-1'])
    expect(idsFor('nine-plus-months')).toEqual([])
    expect(idsFor('day-of')).toEqual(['dayof'])
  })

  it('groups time buckets into Now, Next and Later columns and keeps Done apart', () => {
    const now = new Date('2026-04-15T12:00:00.000Z')
    const buckets = bucketTasks(
      [
        { ...baseTask, id: 'week', dueDate: new Date('2026-04-16T00:00:00.000Z') },
        { ...baseTask, id: 'three', monthsBeforeWedding: 2 },
        { ...baseTask, id: 'six', monthsBeforeWedding: 5 },
        { ...baseTask, id: 'nine', monthsBeforeWedding: 10 },
        { ...baseTask, id: 'dayof', monthsBeforeWedding: 0 },
        { ...baseTask, id: 'done', completed: true },
      ],
      now
    )

    const { horizons, done } = groupBucketsIntoHorizons(buckets)

    expect(horizons.map((horizon) => horizon.key)).toEqual(['now', 'next', 'later'])
    expect(horizons.map((horizon) => horizon.title)).toEqual(['Now', 'Next', 'Later'])
    expect(horizons[0]?.buckets.map((bucket) => bucket.key)).toEqual(['this-week', 'this-month'])
    expect(horizons[1]?.buckets.map((bucket) => bucket.key)).toEqual(['three-months'])
    expect(horizons[2]?.buckets.map((bucket) => bucket.key)).toEqual([
      'six-months',
      'nine-plus-months',
      'day-of',
    ])
    expect(horizons.map((horizon) => horizon.taskCount)).toEqual([1, 1, 3])
    expect(done.tasks.map((task) => task.id)).toEqual(['done'])
  })

  it('reports completion as a whole percentage and zero for an empty list', () => {
    expect(getCompletionPercent([])).toBe(0)
    expect(
      getCompletionPercent([
        { ...baseTask, id: 'a', completed: true },
        { ...baseTask, id: 'b' },
        { ...baseTask, id: 'c' },
      ])
    ).toBe(33)
  })

  it('flags milestone override divergence only when the effective status differs from derived', () => {
    expect(
      hasMilestoneOverrideDivergence({
        ...baseMilestone,
        userOverrideStatus: 'attested',
        effectiveStatus: 'done',
      })
    ).toBe(true)

    expect(
      hasMilestoneOverrideDivergence({
        ...baseMilestone,
        derivedStatus: 'done',
        effectiveStatus: 'done',
        userOverrideStatus: 'attested',
      })
    ).toBe(false)
  })
})
