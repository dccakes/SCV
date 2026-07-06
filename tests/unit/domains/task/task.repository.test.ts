import { TaskCategory } from '@prisma/client'

import { TaskRepository } from '~/server/domains/task/task.repository'

describe('TaskRepository', () => {
  const mockTaskFindUnique = jest.fn()
  const mockTaskFindMany = jest.fn()
  const mockTaskCreate = jest.fn()
  const mockTaskUpdate = jest.fn()
  const mockTaskDelete = jest.fn()
  const mockTaskFindFirst = jest.fn()
  const mockEventFindFirst = jest.fn()

  const mockDb = {
    task: {
      findUnique: mockTaskFindUnique,
      findMany: mockTaskFindMany,
      create: mockTaskCreate,
      update: mockTaskUpdate,
      delete: mockTaskDelete,
      findFirst: mockTaskFindFirst,
    },
    event: {
      findFirst: mockEventFindFirst,
    },
  }

  const taskRow = {
    id: 'task-1',
    weddingId: 'wedding-1',
    eventId: 'event-1',
    vendorId: null,
    milestoneId: null,
    seedKey: null,
    title: 'Book florist',
    category: TaskCategory.VENDORS,
    monthsBeforeWedding: 6,
    dueDate: new Date('2026-05-01T00:00:00.000Z'),
    description: 'Compare three florist quotes',
    notes: null,
    isDefault: false,
    position: 4,
    completed: false,
    completedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  }

  let repository: TaskRepository

  beforeEach(() => {
    jest.resetAllMocks()
    repository = new TaskRepository(mockDb as never)
  })

  it('creates a task', async () => {
    mockTaskCreate.mockResolvedValue(taskRow)

    const result = await repository.create({
      weddingId: 'wedding-1',
      eventId: 'event-1',
      title: 'Book florist',
      category: TaskCategory.VENDORS,
      monthsBeforeWedding: 6,
      dueDate: new Date('2026-05-01T00:00:00.000Z'),
      description: 'Compare three florist quotes',
      position: 4,
    })

    expect(result).toEqual(taskRow)
    expect(mockTaskCreate).toHaveBeenCalledWith({
      data: {
        weddingId: 'wedding-1',
        eventId: 'event-1',
        title: 'Book florist',
        category: TaskCategory.VENDORS,
        monthsBeforeWedding: 6,
        dueDate: new Date('2026-05-01T00:00:00.000Z'),
        description: 'Compare three florist quotes',
        position: 4,
      },
    })
  })

  it('updates a task', async () => {
    const completedAt = new Date('2026-04-26T10:00:00.000Z')
    mockTaskUpdate.mockResolvedValue({
      ...taskRow,
      title: 'Confirm florist',
      completed: true,
      completedAt,
    })

    const result = await repository.update('task-1', {
      title: 'Confirm florist',
      completed: true,
      completedAt,
    })

    expect(result.completed).toBe(true)
    expect(mockTaskUpdate).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: {
        title: 'Confirm florist',
        completed: true,
        completedAt,
      },
    })
  })

  it('preserves explicit null clears in task updates', async () => {
    mockTaskUpdate.mockResolvedValue({
      ...taskRow,
      vendorId: null,
      milestoneId: null,
      dueDate: null,
      description: null,
      notes: null,
      completed: false,
      completedAt: null,
    })

    await repository.update('task-1', {
      vendorId: null,
      milestoneId: null,
      dueDate: null,
      description: null,
      notes: null,
      completed: false,
      completedAt: null,
    })

    expect(mockTaskUpdate).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: {
        vendorId: null,
        milestoneId: null,
        dueDate: null,
        description: null,
        notes: null,
        completed: false,
        completedAt: null,
      },
    })
  })

  it('lists tasks by wedding with supported filters', async () => {
    mockTaskFindMany.mockResolvedValue([taskRow])

    const result = await repository.findByWeddingId('wedding-1', {
      category: TaskCategory.VENDORS,
      eventId: 'event-1',
      completed: false,
    })

    expect(result).toEqual([taskRow])
    expect(mockTaskFindMany).toHaveBeenCalledWith({
      where: {
        weddingId: 'wedding-1',
        category: TaskCategory.VENDORS,
        eventId: 'event-1',
        completed: false,
      },
      orderBy: [
        { completed: 'asc' },
        { dueDate: 'asc' },
        { monthsBeforeWedding: 'asc' },
        { position: 'asc' },
        { createdAt: 'asc' },
      ],
    })
  })

  it('returns active task candidates for the priority queue', async () => {
    mockTaskFindMany.mockResolvedValue([taskRow])

    const result = await repository.findPriorityQueueCandidates('wedding-1')

    expect(result).toEqual([taskRow])
    expect(mockTaskFindMany).toHaveBeenCalledWith({
      where: {
        weddingId: 'wedding-1',
        completed: false,
      },
      orderBy: [
        { dueDate: 'asc' },
        { monthsBeforeWedding: 'asc' },
        { position: 'asc' },
        { createdAt: 'asc' },
      ],
    })
  })

  it('checks task ownership by wedding id', async () => {
    mockTaskFindFirst.mockResolvedValue({ id: 'task-1' })

    const result = await repository.belongsToWedding('task-1', 'wedding-1')

    expect(result).toBe(true)
    expect(mockTaskFindFirst).toHaveBeenCalledWith({
      where: { id: 'task-1', weddingId: 'wedding-1' },
      select: { id: true },
    })
  })

  it('checks event ownership for task assignment', async () => {
    mockEventFindFirst.mockResolvedValue({ id: 'event-1' })

    const result = await repository.eventBelongsToWedding('event-1', 'wedding-1')

    expect(result).toBe(true)
    expect(mockEventFindFirst).toHaveBeenCalledWith({
      where: { id: 'event-1', weddingId: 'wedding-1' },
      select: { id: true },
    })
  })

  it('finds the first created event id for a wedding', async () => {
    mockEventFindFirst.mockResolvedValue({ id: 'event-first' })

    const result = await repository.findFirstEventId('wedding-1')

    expect(result).toBe('event-first')
    expect(mockEventFindFirst).toHaveBeenCalledWith({
      where: { weddingId: 'wedding-1' },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: { id: true },
    })
  })

  it('deletes a task', async () => {
    mockTaskDelete.mockResolvedValue(taskRow)

    const result = await repository.delete('task-1')

    expect(result).toEqual(taskRow)
    expect(mockTaskDelete).toHaveBeenCalledWith({
      where: { id: 'task-1' },
    })
  })
})
