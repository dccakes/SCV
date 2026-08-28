import { TaskCategory } from '@prisma/client'
import { TRPCError } from '@trpc/server'

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))

jest.mock('~/server/domains/task/task.repository')

import { requirePermission } from '~/server/authz/permission-checker'
// @ts-expect-error test mock exports
import {
  mockBelongsToWedding,
  mockCreate,
  mockDelete,
  mockEventBelongsToWedding,
  mockFindById,
  mockFindByWeddingId,
  mockFindFirstEventId,
  mockFindPriorityQueueCandidates,
  mockTask,
  mockUpdate,
  resetMocks,
  TaskRepository,
} from '~/server/domains/task/task.repository'
import { TaskService } from '~/server/domains/task/task.service'

const mockRequirePermission = requirePermission as jest.Mock
const mockBelongsToWeddingFn = mockBelongsToWedding as jest.Mock
const mockCreateFn = mockCreate as jest.Mock
const mockDeleteFn = mockDelete as jest.Mock
const mockEventBelongsToWeddingFn = mockEventBelongsToWedding as jest.Mock
const mockFindByIdFn = mockFindById as jest.Mock
const mockFindByWeddingIdFn = mockFindByWeddingId as jest.Mock
const mockFindFirstEventIdFn = mockFindFirstEventId as jest.Mock
const mockFindPriorityQueueCandidatesFn = mockFindPriorityQueueCandidates as jest.Mock
const mockUpdateFn = mockUpdate as jest.Mock

describe('TaskService', () => {
  const actorContext = {
    userId: 'user-123',
    activeOrganization: {
      organizationId: 'org-123',
      role: 'owner',
    },
  }

  let taskService: TaskService

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-22T12:00:00.000Z'))
    resetMocks()
    mockRequirePermission.mockReset()
    mockRequirePermission.mockReturnValue({ organizationId: 'org-123', role: 'owner' })
    taskService = new TaskService(new TaskRepository({}))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('lists tasks for a wedding with read permission', async () => {
    mockFindByWeddingIdFn.mockResolvedValue([mockTask])

    const result = await taskService.listTasks(actorContext, 'wedding-123', {
      category: TaskCategory.VENDORS,
      completed: false,
    })

    expect(result).toEqual([mockTask])
    expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { wedding: ['read'] })
    expect(mockFindByWeddingIdFn).toHaveBeenCalledWith('wedding-123', {
      category: TaskCategory.VENDORS,
      completed: false,
    })
  })

  it('creates a task using the first created wedding event when eventId is omitted', async () => {
    mockFindFirstEventIdFn.mockResolvedValue('event-first')
    mockCreateFn.mockResolvedValue({ ...mockTask, eventId: 'event-first' })

    const result = await taskService.createTask(actorContext, 'wedding-123', {
      title: 'Book florist',
      category: TaskCategory.VENDORS,
      monthsBeforeWedding: 6,
    })

    expect(result.eventId).toBe('event-first')
    expect(mockCreateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        weddingId: 'wedding-123',
        eventId: 'event-first',
      })
    )
  })

  it('rejects task creation when the wedding has no event', async () => {
    mockFindFirstEventIdFn.mockResolvedValue(null)

    await expect(
      taskService.createTask(actorContext, 'wedding-123', {
        title: 'Book florist',
        category: TaskCategory.VENDORS,
        monthsBeforeWedding: 6,
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })

    expect(mockCreateFn).not.toHaveBeenCalled()
  })

  it('rejects assigning a create request to an event from another wedding', async () => {
    mockEventBelongsToWeddingFn.mockResolvedValue(false)

    await expect(
      taskService.createTask(actorContext, 'wedding-123', {
        eventId: 'event-other',
        title: 'Book florist',
        category: TaskCategory.VENDORS,
        monthsBeforeWedding: 6,
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })

    expect(mockCreateFn).not.toHaveBeenCalled()
  })

  it('updates a task and allows reassignment to another event in the same wedding', async () => {
    mockBelongsToWeddingFn.mockResolvedValue(true)
    mockEventBelongsToWeddingFn.mockResolvedValue(true)
    mockUpdateFn.mockResolvedValue({ ...mockTask, eventId: 'event-2', title: 'Confirm florist' })

    const result = await taskService.updateTask(actorContext, 'wedding-123', {
      taskId: 'task-123',
      eventId: 'event-2',
      title: 'Confirm florist',
    })

    expect(result).toEqual({ ...mockTask, eventId: 'event-2', title: 'Confirm florist' })
    expect(mockUpdateFn).toHaveBeenCalledWith(
      'task-123',
      expect.objectContaining({ eventId: 'event-2', title: 'Confirm florist' })
    )
  })

  it('allows nullable task fields to be cleared on update', async () => {
    mockBelongsToWeddingFn.mockResolvedValue(true)
    mockUpdateFn.mockResolvedValue({
      ...mockTask,
      vendorId: null,
      milestoneId: null,
      dueDate: null,
      description: null,
      notes: null,
    })

    await taskService.updateTask(actorContext, 'wedding-123', {
      taskId: 'task-123',
      vendorId: null,
      milestoneId: null,
      dueDate: null,
      description: null,
      notes: null,
    })

    expect(mockUpdateFn).toHaveBeenCalledWith('task-123', {
      vendorId: null,
      milestoneId: null,
      dueDate: null,
      description: null,
      notes: null,
    })
  })

  it('rejects reassignment to an event in another wedding', async () => {
    mockBelongsToWeddingFn.mockResolvedValue(true)
    mockEventBelongsToWeddingFn.mockResolvedValue(false)

    await expect(
      taskService.updateTask(actorContext, 'wedding-123', {
        taskId: 'task-123',
        eventId: 'event-other',
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })

    expect(mockUpdateFn).not.toHaveBeenCalled()
  })

  it('sets completedAt when marking a task complete', async () => {
    mockBelongsToWeddingFn.mockResolvedValue(true)
    const completedAt = new Date('2026-04-22T12:00:00.000Z')
    mockUpdateFn.mockResolvedValue({ ...mockTask, completed: true, completedAt })

    const result = await taskService.completeTask(actorContext, 'wedding-123', 'task-123', true)

    expect(result.completed).toBe(true)
    expect(mockUpdateFn).toHaveBeenCalledWith('task-123', {
      completed: true,
      completedAt,
    })
  })

  it('clears completedAt when marking a task incomplete', async () => {
    mockBelongsToWeddingFn.mockResolvedValue(true)
    mockUpdateFn.mockResolvedValue({ ...mockTask, completed: false, completedAt: null })

    const result = await taskService.completeTask(actorContext, 'wedding-123', 'task-123', false)

    expect(result.completed).toBe(false)
    expect(mockUpdateFn).toHaveBeenCalledWith('task-123', {
      completed: false,
      completedAt: null,
    })
  })

  it('gets a single task within the active wedding scope', async () => {
    mockFindByIdFn.mockResolvedValue(mockTask)

    const result = await taskService.getTaskById(actorContext, 'wedding-123', 'task-123')

    expect(result).toEqual(mockTask)
    expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { wedding: ['read'] })
  })

  it('rejects reads for tasks outside the active wedding scope', async () => {
    mockFindByIdFn.mockResolvedValue({ ...mockTask, weddingId: 'other-wedding' })

    await expect(
      taskService.getTaskById(actorContext, 'wedding-123', 'task-123')
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('deletes a task in the active wedding scope', async () => {
    mockBelongsToWeddingFn.mockResolvedValue(true)
    mockDeleteFn.mockResolvedValue(mockTask)

    const result = await taskService.deleteTask(actorContext, 'wedding-123', 'task-123')

    expect(result).toBe('task-123')
    expect(mockDeleteFn).toHaveBeenCalledWith('task-123')
  })

  it('returns the priority queue ordered by overdue, current week, then upcoming urgency', async () => {
    mockFindPriorityQueueCandidatesFn.mockResolvedValue([
      {
        ...mockTask,
        id: 'task-upcoming-months-3',
        title: 'Choose music',
        dueDate: null,
        monthsBeforeWedding: 3,
        position: 2,
      },
      {
        ...mockTask,
        id: 'task-overdue-1',
        title: 'Review florist quotes',
        dueDate: new Date('2026-04-20T00:00:00.000Z'),
        monthsBeforeWedding: 6,
        position: 3,
      },
      {
        ...mockTask,
        id: 'task-this-week-1',
        title: 'Send invitations',
        dueDate: new Date('2026-04-24T00:00:00.000Z'),
        monthsBeforeWedding: 1,
        position: 1,
      },
      {
        ...mockTask,
        id: 'task-overdue-2',
        title: 'Confirm venue',
        dueDate: new Date('2026-04-21T00:00:00.000Z'),
        monthsBeforeWedding: 9,
        position: 0,
      },
      {
        ...mockTask,
        id: 'task-upcoming-due-1',
        title: 'Finalize menu',
        dueDate: new Date('2026-04-29T00:00:00.000Z'),
        monthsBeforeWedding: 2,
        position: 4,
      },
      {
        ...mockTask,
        id: 'task-upcoming-months-1',
        title: 'Get marriage license',
        dueDate: null,
        monthsBeforeWedding: 1,
        position: 5,
      },
      {
        ...mockTask,
        id: 'task-this-week-2',
        title: 'Pay deposit',
        dueDate: new Date('2026-04-25T00:00:00.000Z'),
        monthsBeforeWedding: 2,
        position: 6,
      },
    ])

    const result = await taskService.getPriorityQueue(actorContext, 'wedding-123')

    expect(result.totalActive).toBe(7)
    expect(result.tasks.map((task) => task.id)).toEqual([
      'task-overdue-1',
      'task-overdue-2',
      'task-this-week-1',
      'task-this-week-2',
      'task-upcoming-months-3',
      'task-upcoming-due-1',
    ])
  })

  it('propagates permission failures', async () => {
    mockRequirePermission.mockImplementation(() => {
      throw new TRPCError({ code: 'FORBIDDEN' })
    })

    await expect(taskService.listTasks(actorContext, 'wedding-123')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })
})
