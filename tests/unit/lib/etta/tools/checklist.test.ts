/**
 * @jest-environment node
 */

import { TaskCategory } from '@prisma/client'
import { TRPCError } from '@trpc/server'

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(() => ({ organizationId: 'org-1', role: 'owner' })),
}))

jest.mock('~/lib/etta/utils/audit', () => ({
  logAudit: jest.fn(),
}))

jest.mock('~/server/domains/task', () => ({
  taskService: {
    completeTask: jest.fn(),
    createTask: jest.fn(),
    getPriorityQueue: jest.fn(),
    listTasks: jest.fn(),
  },
}))

import { getChecklistTools } from '~/lib/etta/tools/checklist'
import type { EttaContext } from '~/lib/etta/types'
import { logAudit } from '~/lib/etta/utils/audit'
import { requirePermission } from '~/server/authz/permission-checker'
import { taskService } from '~/server/domains/task'

const mockLogAudit = logAudit as jest.Mock
const mockRequirePermission = requirePermission as jest.Mock
const mockTaskService = taskService as {
  completeTask: jest.Mock
  createTask: jest.Mock
  getPriorityQueue: jest.Mock
  listTasks: jest.Mock
}

const mockCtx: EttaContext = {
  weddingId: 'wedding-123',
  ettaActorId: 'actor-123',
  actor: 'couple',
  authz: { userId: 'user-1', activeOrganization: { organizationId: 'org-1', role: 'owner' } },
  wedding: {
    groomFirstName: 'John',
    groomLastName: 'Doe',
    brideFirstName: 'Jane',
    brideLastName: 'Smith',
  },
  guestCount: 50,
  eventCount: 2,
  vendorCount: 3,
  pendingSuggestionCount: 1,
  recentMemories: [],
}

describe('getChecklistTools', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequirePermission.mockImplementation(() => ({ organizationId: 'org-1', role: 'owner' }))
  })

  const tools = getChecklistTools(mockCtx)

  it('returns the priority queue when no filters are provided', async () => {
    mockTaskService.getPriorityQueue.mockResolvedValue({
      tasks: [{ id: 'task-1', title: 'Book florist' }],
      totalActive: 4,
    })

    const result = await tools.get_tasks.execute(
      {},
      { toolCallId: 'tc1', messages: [], abortSignal: undefined as never }
    )

    expect(mockTaskService.getPriorityQueue).toHaveBeenCalledWith(mockCtx.authz, 'wedding-123')
    expect(result).toEqual({
      mode: 'priority',
      tasks: [{ id: 'task-1', title: 'Book florist' }],
      totalActive: 4,
    })
  })

  it('returns a filtered task list when filters are provided', async () => {
    mockTaskService.listTasks.mockResolvedValue([{ id: 'task-2', title: 'Send invites' }])

    const result = await tools.get_tasks.execute(
      { category: TaskCategory.STATIONERY, status: 'active' },
      { toolCallId: 'tc2', messages: [], abortSignal: undefined as never }
    )

    expect(mockTaskService.listTasks).toHaveBeenCalledWith(mockCtx.authz, 'wedding-123', {
      category: TaskCategory.STATIONERY,
      eventId: undefined,
      completed: false,
    })
    expect(result).toEqual({
      mode: 'list',
      tasks: [{ id: 'task-2', title: 'Send invites' }],
      filters: {
        category: TaskCategory.STATIONERY,
        eventId: undefined,
        status: 'active',
      },
    })
  })

  it('marks a task complete and writes an audit entry', async () => {
    mockTaskService.completeTask.mockResolvedValue({
      id: 'task-3',
      title: 'Confirm caterer',
    })

    const result = await tools.complete_task.execute(
      { taskId: 'task-3' },
      { toolCallId: 'tc3', messages: [], abortSignal: undefined as never }
    )

    expect(mockTaskService.completeTask).toHaveBeenCalledWith(
      mockCtx.authz,
      'wedding-123',
      'task-3',
      true
    )
    expect(mockLogAudit).toHaveBeenCalledWith({
      weddingId: 'wedding-123',
      actorId: 'actor-123',
      actorType: 'etta',
      action: 'complete_task',
      resourceType: 'task',
      resourceId: 'task-3',
      payload: { taskId: 'task-3', title: 'Confirm caterer' },
    })
    expect(result.message).toBe('Task marked as complete: Confirm caterer')
  })

  it('creates a task and writes an audit entry', async () => {
    mockTaskService.createTask.mockResolvedValue({
      id: 'task-4',
      title: 'Order flowers',
      category: TaskCategory.VENDORS,
    })

    const result = await tools.add_task.execute(
      {
        title: 'Order flowers',
        category: TaskCategory.VENDORS,
        monthsBeforeWedding: 6,
      },
      { toolCallId: 'tc4', messages: [], abortSignal: undefined as never }
    )

    expect(mockTaskService.createTask).toHaveBeenCalledWith(mockCtx.authz, 'wedding-123', {
      title: 'Order flowers',
      category: TaskCategory.VENDORS,
      monthsBeforeWedding: 6,
    })
    expect(mockLogAudit).toHaveBeenCalledWith({
      weddingId: 'wedding-123',
      actorId: 'actor-123',
      actorType: 'etta',
      action: 'add_task',
      resourceType: 'task',
      resourceId: 'task-4',
      payload: {
        taskId: 'task-4',
        title: 'Order flowers',
        category: TaskCategory.VENDORS,
      },
    })
    expect(result.message).toBe('Task created: Order flowers')
  })

  it('propagates permission failures for task mutations', async () => {
    mockRequirePermission.mockImplementation(() => {
      throw new TRPCError({ code: 'FORBIDDEN' })
    })

    await expect(
      tools.complete_task.execute(
        { taskId: 'task-3' },
        { toolCallId: 'tc5', messages: [], abortSignal: undefined as never }
      )
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })
})
