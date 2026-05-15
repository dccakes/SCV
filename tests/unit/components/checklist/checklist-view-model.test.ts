import { TaskCategory } from '@prisma/client'
import {
  bucketTasks,
  filterTasks,
  getChecklistFiltersFromSearchParams,
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
