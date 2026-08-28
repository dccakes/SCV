import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import { taskService } from '~/server/domains/task'
import {
  completeTaskSchema,
  createTaskSchema,
  deleteTaskSchema,
  getPriorityQueueSchema,
  getTaskSchema,
  listTasksSchema,
  updateTaskSchema,
} from '~/server/domains/task/task.validator'

export const taskRouter = createTRPCRouter({
  create: protectedProcedure.input(createTaskSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return taskService.createTask(ctx.authz, weddingId, input)
  }),

  update: protectedProcedure.input(updateTaskSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return taskService.updateTask(ctx.authz, weddingId, input)
  }),

  complete: protectedProcedure.input(completeTaskSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return taskService.completeTask(ctx.authz, weddingId, input.taskId, input.completed)
  }),

  delete: protectedProcedure.input(deleteTaskSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return taskService.deleteTask(ctx.authz, weddingId, input.taskId)
  }),

  list: protectedProcedure.input(listTasksSchema).query(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return taskService.listTasks(ctx.authz, weddingId, input)
  }),

  getById: protectedProcedure.input(getTaskSchema).query(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return taskService.getTaskById(ctx.authz, weddingId, input.taskId)
  }),

  getPriorityQueue: protectedProcedure.input(getPriorityQueueSchema).query(async ({ ctx }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return taskService.getPriorityQueue(ctx.authz, weddingId)
  }),
})
