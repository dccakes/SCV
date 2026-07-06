import type { PrismaClient } from '@prisma/client'

import type {
  Task,
  TaskCreateData,
  TaskListFilters,
  TaskUpdateData,
} from '~/server/domains/task/task.types'

export class TaskRepository {
  constructor(private db: PrismaClient) {}

  async findById(id: string): Promise<Task | null> {
    return this.db.task.findUnique({
      where: { id },
    }) as Promise<Task | null>
  }

  async findByWeddingId(weddingId: string, filters: TaskListFilters = {}): Promise<Task[]> {
    return this.db.task.findMany({
      where: {
        weddingId,
        category: filters.category,
        eventId: filters.eventId,
        completed: filters.completed,
      },
      orderBy: [
        { completed: 'asc' },
        { dueDate: 'asc' },
        { monthsBeforeWedding: 'asc' },
        { position: 'asc' },
        { createdAt: 'asc' },
      ],
    }) as Promise<Task[]>
  }

  async findPriorityQueueCandidates(weddingId: string): Promise<Task[]> {
    return this.db.task.findMany({
      where: {
        weddingId,
        completed: false,
      },
      orderBy: [
        { dueDate: 'asc' },
        { monthsBeforeWedding: 'asc' },
        { position: 'asc' },
        { createdAt: 'asc' },
      ],
    }) as Promise<Task[]>
  }

  async create(data: TaskCreateData): Promise<Task> {
    return this.db.task.create({
      data: {
        weddingId: data.weddingId,
        eventId: data.eventId,
        title: data.title,
        category: data.category,
        monthsBeforeWedding: data.monthsBeforeWedding,
        ...(hasTaskField(data, 'vendorId') ? { vendorId: data.vendorId } : {}),
        ...(hasTaskField(data, 'milestoneId') ? { milestoneId: data.milestoneId } : {}),
        ...(hasTaskField(data, 'seedKey') ? { seedKey: data.seedKey } : {}),
        ...(hasTaskField(data, 'dueDate') ? { dueDate: data.dueDate } : {}),
        ...(hasTaskField(data, 'description') ? { description: data.description } : {}),
        ...(hasTaskField(data, 'notes') ? { notes: data.notes } : {}),
        ...(hasTaskField(data, 'isDefault') ? { isDefault: data.isDefault } : {}),
        ...(hasTaskField(data, 'position') ? { position: data.position } : {}),
        ...(hasTaskField(data, 'completed') ? { completed: data.completed } : {}),
        ...(hasTaskField(data, 'completedAt') ? { completedAt: data.completedAt } : {}),
      },
    }) as Promise<Task>
  }

  async update(id: string, data: TaskUpdateData): Promise<Task> {
    return this.db.task.update({
      where: { id },
      data: {
        ...(hasTaskField(data, 'eventId') ? { eventId: data.eventId } : {}),
        ...(hasTaskField(data, 'vendorId') ? { vendorId: data.vendorId } : {}),
        ...(hasTaskField(data, 'milestoneId') ? { milestoneId: data.milestoneId } : {}),
        ...(hasTaskField(data, 'title') ? { title: data.title } : {}),
        ...(hasTaskField(data, 'category') ? { category: data.category } : {}),
        ...(hasTaskField(data, 'monthsBeforeWedding')
          ? { monthsBeforeWedding: data.monthsBeforeWedding }
          : {}),
        ...(hasTaskField(data, 'dueDate') ? { dueDate: data.dueDate } : {}),
        ...(hasTaskField(data, 'description') ? { description: data.description } : {}),
        ...(hasTaskField(data, 'notes') ? { notes: data.notes } : {}),
        ...(hasTaskField(data, 'position') ? { position: data.position } : {}),
        ...(hasTaskField(data, 'completed') ? { completed: data.completed } : {}),
        ...(hasTaskField(data, 'completedAt') ? { completedAt: data.completedAt } : {}),
      },
    }) as Promise<Task>
  }

  async delete(id: string): Promise<Task> {
    return this.db.task.delete({
      where: { id },
    }) as Promise<Task>
  }

  async belongsToWedding(id: string, weddingId: string): Promise<boolean> {
    const task = await this.db.task.findFirst({
      where: { id, weddingId },
      select: { id: true },
    })

    return task !== null
  }

  async eventBelongsToWedding(eventId: string, weddingId: string): Promise<boolean> {
    const event = await this.db.event.findFirst({
      where: { id: eventId, weddingId },
      select: { id: true },
    })

    return event !== null
  }

  async findFirstEventId(weddingId: string): Promise<string | null> {
    const event = await this.db.event.findFirst({
      where: { weddingId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: { id: true },
    })

    return event?.id ?? null
  }
}

const hasTaskField = <T extends object, K extends keyof T>(value: T, key: K): boolean =>
  Object.hasOwn(value, key)
