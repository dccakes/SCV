import {
  completeTaskSchema,
  createTaskSchema,
  deleteTaskSchema,
  getPriorityQueueSchema,
  getTaskSchema,
  listTasksSchema,
  updateTaskSchema,
} from '~/server/domains/task/task.validator'

describe('createTaskSchema', () => {
  it('accepts a valid task without an explicit event id', () => {
    const result = createTaskSchema.safeParse({
      title: 'Book florist',
      category: 'VENDORS',
      monthsBeforeWedding: 6,
      dueDate: '2026-05-01',
    })

    expect(result.success).toBe(true)
  })

  it('rejects an invalid due date', () => {
    const result = createTaskSchema.safeParse({
      title: 'Book florist',
      category: 'VENDORS',
      monthsBeforeWedding: 6,
      dueDate: '05/01/2026',
    })

    expect(result.success).toBe(false)
  })

  it('rejects an impossible calendar date', () => {
    const result = createTaskSchema.safeParse({
      title: 'Book florist',
      category: 'VENDORS',
      monthsBeforeWedding: 6,
      dueDate: '2026-02-31',
    })

    expect(result.success).toBe(false)
  })
})

describe('updateTaskSchema', () => {
  it('accepts a partial task update', () => {
    const result = updateTaskSchema.safeParse({
      taskId: 'task-123',
      title: 'Confirm florist',
      eventId: 'event-2',
    })

    expect(result.success).toBe(true)
  })

  it('requires a task id', () => {
    const result = updateTaskSchema.safeParse({ title: 'Confirm florist' })

    expect(result.success).toBe(false)
  })

  it('allows nullable fields to be cleared explicitly', () => {
    const result = updateTaskSchema.safeParse({
      taskId: 'task-123',
      vendorId: null,
      milestoneId: null,
      dueDate: null,
      description: null,
      notes: null,
    })

    expect(result.success).toBe(true)
  })
})

describe('listTasksSchema', () => {
  it('accepts supported filters', () => {
    const result = listTasksSchema.safeParse({
      category: 'VENDORS',
      eventId: 'event-123',
      completed: false,
    })

    expect(result.success).toBe(true)
  })
})

describe('getTaskSchema and deleteTaskSchema', () => {
  it('accept valid task ids', () => {
    expect(getTaskSchema.safeParse({ taskId: 'task-123' }).success).toBe(true)
    expect(deleteTaskSchema.safeParse({ taskId: 'task-123' }).success).toBe(true)
  })
})

describe('completeTaskSchema', () => {
  it('defaults completed to true when omitted', () => {
    const result = completeTaskSchema.safeParse({ taskId: 'task-123' })

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error('expected completeTaskSchema to succeed')
    }
    expect(result.data.completed).toBe(true)
  })
})

describe('getPriorityQueueSchema', () => {
  it('accepts an empty object', () => {
    const result = getPriorityQueueSchema.safeParse({})

    expect(result.success).toBe(true)
  })
})
