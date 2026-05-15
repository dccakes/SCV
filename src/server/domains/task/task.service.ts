import { TRPCError } from '@trpc/server'

import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import { buildTaskPriorityQueue } from '~/server/domains/task/task.priority'
import type { TaskRepository } from '~/server/domains/task/task.repository'
import type { Task, TaskPriorityQueueResult } from '~/server/domains/task/task.types'
import type {
  CreateTaskInput,
  ListTasksInput,
  UpdateTaskInput,
} from '~/server/domains/task/task.validator'

export class TaskService {
  constructor(private taskRepository: TaskRepository) {}

  async createTask(ctx: AuthzContext, weddingId: string, input: CreateTaskInput): Promise<Task> {
    requirePermission(ctx, { wedding: ['update'] })
    const eventId = await this.resolveEventId(weddingId, input.eventId)

    return this.taskRepository.create({
      weddingId,
      eventId,
      title: input.title,
      category: input.category,
      monthsBeforeWedding: input.monthsBeforeWedding,
      ...(hasInputField(input, 'vendorId') ? { vendorId: input.vendorId } : {}),
      ...(hasInputField(input, 'milestoneId') ? { milestoneId: input.milestoneId } : {}),
      ...(hasInputField(input, 'dueDate')
        ? { dueDate: input.dueDate ? parseDateInput(input.dueDate) : null }
        : {}),
      ...(hasInputField(input, 'description') ? { description: input.description } : {}),
      ...(hasInputField(input, 'notes') ? { notes: input.notes } : {}),
      ...(hasInputField(input, 'position') ? { position: input.position } : {}),
    })
  }

  async updateTask(ctx: AuthzContext, weddingId: string, input: UpdateTaskInput): Promise<Task> {
    requirePermission(ctx, { wedding: ['update'] })
    await this.assertTaskOwnership(input.taskId, weddingId)

    const updateData = {
      ...(hasInputField(input, 'eventId') && input.eventId
        ? { eventId: await this.assertEventAssignment(input.eventId, weddingId) }
        : {}),
      ...(hasInputField(input, 'vendorId') ? { vendorId: input.vendorId } : {}),
      ...(hasInputField(input, 'milestoneId') ? { milestoneId: input.milestoneId } : {}),
      ...(hasInputField(input, 'title') ? { title: input.title } : {}),
      ...(hasInputField(input, 'category') ? { category: input.category } : {}),
      ...(hasInputField(input, 'monthsBeforeWedding')
        ? { monthsBeforeWedding: input.monthsBeforeWedding }
        : {}),
      ...(hasInputField(input, 'dueDate')
        ? { dueDate: input.dueDate ? parseDateInput(input.dueDate) : null }
        : {}),
      ...(hasInputField(input, 'description') ? { description: input.description } : {}),
      ...(hasInputField(input, 'notes') ? { notes: input.notes } : {}),
      ...(hasInputField(input, 'position') ? { position: input.position } : {}),
    }

    return this.taskRepository.update(input.taskId, updateData)
  }

  async completeTask(
    ctx: AuthzContext,
    weddingId: string,
    taskId: string,
    completed = true
  ): Promise<Task> {
    requirePermission(ctx, { wedding: ['update'] })
    await this.assertTaskOwnership(taskId, weddingId)

    const completedAt = completed ? new Date() : null
    return this.taskRepository.update(taskId, {
      completed,
      completedAt,
    })
  }

  async deleteTask(ctx: AuthzContext, weddingId: string, taskId: string): Promise<string> {
    requirePermission(ctx, { wedding: ['update'] })
    await this.assertTaskOwnership(taskId, weddingId)

    const deleted = await this.taskRepository.delete(taskId)
    return deleted.id
  }

  async listTasks(
    ctx: AuthzContext,
    weddingId: string,
    filters: ListTasksInput = {}
  ): Promise<Task[]> {
    requirePermission(ctx, { wedding: ['read'] })
    return this.taskRepository.findByWeddingId(weddingId, filters)
  }

  async getTaskById(ctx: AuthzContext, weddingId: string, taskId: string): Promise<Task> {
    requirePermission(ctx, { wedding: ['read'] })

    const task = await this.taskRepository.findById(taskId)
    if (!task) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' })
    }

    if (task.weddingId !== weddingId) {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    return task
  }

  async getPriorityQueue(ctx: AuthzContext, weddingId: string): Promise<TaskPriorityQueueResult> {
    requirePermission(ctx, { wedding: ['read'] })

    const activeTasks = await this.taskRepository.findPriorityQueueCandidates(weddingId)
    return buildTaskPriorityQueue(activeTasks)
  }

  private async resolveEventId(weddingId: string, eventId?: string): Promise<string> {
    if (eventId) {
      return this.assertEventAssignment(eventId, weddingId)
    }

    const firstEventId = await this.taskRepository.findFirstEventId(weddingId)
    if (!firstEventId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Tasks require a wedding event before they can be created',
      })
    }

    return firstEventId
  }

  private async assertEventAssignment(eventId: string, weddingId: string): Promise<string> {
    const belongs = await this.taskRepository.eventBelongsToWedding(eventId, weddingId)
    if (!belongs) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Event does not belong to the active wedding',
      })
    }

    return eventId
  }

  private async assertTaskOwnership(taskId: string, weddingId: string): Promise<void> {
    const belongs = await this.taskRepository.belongsToWedding(taskId, weddingId)
    if (!belongs) {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }
  }
}

const parseDateInput = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1))
}

const hasInputField = <T extends object, K extends keyof T>(value: T, key: K): boolean =>
  Object.hasOwn(value, key)
