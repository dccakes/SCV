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

  describe('with an event date', () => {
    // Wedding is 2026-07-01, today is 2026-05-01 (about 2 months away).
    const now = new Date('2026-05-01T12:00:00.000Z')
    const eventDates = new Map([['event-1', new Date('2026-07-01T00:00:00.000Z')]])
    const idsIn = (key: string, tasks: Task[]) =>
      bucketTasks(tasks, now, eventDates)
        .find((bucket) => bucket.key === key)
        ?.tasks.map((task) => task.id)

    it('treats monthsBeforeWedding as lead time, so far-out lead times are due sooner', () => {
      const tasks: Task[] = [
        { ...baseTask, id: 'florist', monthsBeforeWedding: 6 }, // due 2026-01-01, overdue
        { ...baseTask, id: 'caterer-headcount', monthsBeforeWedding: 1 }, // due 2026-06-01
        { ...baseTask, id: 'fitting', monthsBeforeWedding: 0 }, // wedding day
      ]

      expect(idsIn('this-week', tasks)).toEqual(['florist'])
      expect(idsIn('this-month', tasks)).toEqual([])
      expect(idsIn('three-months', tasks)).toEqual(['caterer-headcount'])
      expect(idsIn('day-of', tasks)).toEqual(['fitting'])
    })

    it('orders a bucket by the real due date, earliest first', () => {
      const tasks: Task[] = [
        { ...baseTask, id: 'one-month', monthsBeforeWedding: 1 },
        { ...baseTask, id: 'two-months', monthsBeforeWedding: 2 },
      ]
      // Due 2026-07-01 and 2026-08-01, both inside the three-month window from 2026-05-01.
      const september = new Map([['event-1', new Date('2026-09-01T00:00:00.000Z')]])

      const bucket = bucketTasks(tasks, now, september).find((b) => b.key === 'three-months')

      expect(bucket?.tasks.map((task) => task.id)).toEqual(['two-months', 'one-month'])
    })

    it('lets an explicit dueDate win over the derived date', () => {
      const tasks: Task[] = [
        {
          ...baseTask,
          id: 'explicit',
          monthsBeforeWedding: 6,
          dueDate: new Date('2026-05-15T00:00:00.000Z'),
        },
      ]

      expect(idsIn('this-month', tasks)).toEqual(['explicit'])
    })

    it('falls back to lead time, largest first, when the event has no date', () => {
      const undated = new Map([['event-1', null]])
      const tasks: Task[] = [
        { ...baseTask, id: 'two', monthsBeforeWedding: 2 },
        { ...baseTask, id: 'three', monthsBeforeWedding: 3 },
      ]

      const bucket = bucketTasks(tasks, now, undated).find((b) => b.key === 'three-months')

      expect(bucket?.tasks.map((task) => task.id)).toEqual(['three', 'two'])
    })

    it('clamps to the last day of shorter months', () => {
      // 2026-08-31 minus 2 months clamps to 2026-06-30 (this month), not 2026-07-01.
      const june = new Date('2026-06-10T12:00:00.000Z')
      const endOfMonth = new Map([['event-1', new Date('2026-08-31T00:00:00.000Z')]])
      const tasks: Task[] = [{ ...baseTask, id: 'task', monthsBeforeWedding: 2 }]

      const bucket = bucketTasks(tasks, june, endOfMonth).find((b) => b.key === 'this-month')

      expect(bucket?.tasks.map((task) => task.id)).toEqual(['task'])
    })
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
