import { TRPCError } from '@trpc/server'

jest.mock('lib/auth', () => ({
  auth: { api: { getSession: jest.fn().mockResolvedValue(null) } },
}))

jest.mock('server/db', () => ({ db: {} }))

jest.mock('~/server/domains/task', () => ({
  taskService: {
    completeTask: jest.fn(),
    createTask: jest.fn(),
    deleteTask: jest.fn(),
    getPriorityQueue: jest.fn(),
    getTaskById: jest.fn(),
    listTasks: jest.fn(),
    updateTask: jest.fn(),
  },
}))

import { taskService } from '~/server/domains/task'
import { taskRouter } from '~/server/domains/task/task.router'

const mockListTasks = taskService.listTasks as jest.Mock
const mockCreateTask = taskService.createTask as jest.Mock
const mockGetPriorityQueue = taskService.getPriorityQueue as jest.Mock

describe('taskRouter authz context plumbing', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('scopes list to the active wedding and forwards authz context', async () => {
    const activeOrganization = { organizationId: 'org-123', role: 'member' as const }
    mockListTasks.mockResolvedValue([{ id: 'task-1' }])

    const caller = taskRouter.createCaller({
      auth: {
        session: { user: { id: 'user-123' } },
        activeOrganization,
        activeWeddingId: 'wedding-123',
        userId: 'user-123',
      },
      authz: {
        userId: 'user-123',
        activeOrganization,
      },
      db: {} as never,
      headers: new Headers(),
    })

    await caller.list({ completed: false })

    expect(mockListTasks).toHaveBeenCalledWith(
      { userId: 'user-123', activeOrganization },
      'wedding-123',
      { completed: false }
    )
  })

  it('passes create input and wedding scope through to the service', async () => {
    const activeOrganization = { organizationId: 'org-123', role: 'owner' as const }
    mockCreateTask.mockResolvedValue({ id: 'task-1' })

    const caller = taskRouter.createCaller({
      auth: {
        session: { user: { id: 'user-123' } },
        activeOrganization,
        activeWeddingId: 'wedding-123',
        userId: 'user-123',
      },
      authz: {
        userId: 'user-123',
        activeOrganization,
      },
      db: {} as never,
      headers: new Headers(),
    })

    await caller.create({
      title: 'Book florist',
      category: 'VENDORS',
      monthsBeforeWedding: 6,
    })

    expect(mockCreateTask).toHaveBeenCalledWith(
      { userId: 'user-123', activeOrganization },
      'wedding-123',
      {
        title: 'Book florist',
        category: 'VENDORS',
        monthsBeforeWedding: 6,
      }
    )
  })

  it('forwards getPriorityQueue to the service with the active wedding', async () => {
    const activeOrganization = { organizationId: 'org-123', role: 'member' as const }
    mockGetPriorityQueue.mockResolvedValue({ tasks: [], totalActive: 0 })

    const caller = taskRouter.createCaller({
      auth: {
        session: { user: { id: 'user-123' } },
        activeOrganization,
        activeWeddingId: 'wedding-123',
        userId: 'user-123',
      },
      authz: {
        userId: 'user-123',
        activeOrganization,
      },
      db: {} as never,
      headers: new Headers(),
    })

    await caller.getPriorityQueue({})

    expect(mockGetPriorityQueue).toHaveBeenCalledWith(
      { userId: 'user-123', activeOrganization },
      'wedding-123'
    )
  })

  it('rejects unauthenticated list with UNAUTHORIZED', async () => {
    const caller = taskRouter.createCaller({
      auth: {
        session: null,
        activeOrganization: null,
        activeWeddingId: 'wedding-123',
        userId: null,
      },
      authz: {
        userId: '',
        activeOrganization: null,
      },
      db: {} as never,
      headers: new Headers(),
    })

    await expect(caller.list({})).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })

  it('rejects list when active wedding is missing', async () => {
    const activeOrganization = { organizationId: 'org-123', role: 'owner' as const }
    const caller = taskRouter.createCaller({
      auth: {
        session: { user: { id: 'user-123' } },
        activeOrganization,
        activeWeddingId: null,
        userId: 'user-123',
      },
      authz: {
        userId: 'user-123',
        activeOrganization,
      },
      db: {} as never,
      headers: new Headers(),
    })

    await expect(caller.list({})).rejects.toMatchObject({
      code: 'PRECONDITION_FAILED',
    })
  })

  it('passes through service-level forbidden errors', async () => {
    const activeOrganization = { organizationId: 'org-123', role: 'viewer' as const }
    mockListTasks.mockRejectedValue(new TRPCError({ code: 'FORBIDDEN' }))

    const caller = taskRouter.createCaller({
      auth: {
        session: { user: { id: 'user-123' } },
        activeOrganization,
        activeWeddingId: 'wedding-123',
        userId: 'user-123',
      },
      authz: {
        userId: 'user-123',
        activeOrganization,
      },
      db: {} as never,
      headers: new Headers(),
    })

    await expect(caller.list({})).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })
})
