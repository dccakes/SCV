import { TaskCategory } from '@prisma/client'
import { tool, zodSchema } from 'ai'
import { z } from 'zod'

import type { EttaContext } from '~/lib/etta/types'
import { logAudit } from '~/lib/etta/utils/audit'
import { requireEttaPermission, requirePlannerAuthz } from '~/lib/etta/utils/authorization'
import { taskService } from '~/server/domains/task'

const taskCategorySchema = z.enum(TaskCategory)
const taskStatusSchema = z.enum(['active', 'completed', 'all'])

export function getChecklistTools(ctx: EttaContext) {
  return {
    get_tasks: tool({
      description:
        'Get wedding checklist tasks. With no filters, returns the priority queue. With filters, returns the matching task list.',
      inputSchema: zodSchema(
        z.object({
          category: taskCategorySchema.optional(),
          eventId: z.string().min(1).optional(),
          status: taskStatusSchema.optional(),
        })
      ),
      execute: async ({ category, eventId, status }) => {
        const authz = requirePlannerAuthz(ctx)

        if (!category && !eventId && !status) {
          const priorityQueue = await taskService.getPriorityQueue(authz, ctx.weddingId)
          return { mode: 'priority' as const, ...priorityQueue }
        }

        const tasks = await taskService.listTasks(authz, ctx.weddingId, {
          category,
          eventId,
          completed: mapTaskStatus(status),
        })

        return {
          mode: 'list' as const,
          tasks,
          filters: {
            category,
            eventId,
            status: status ?? 'all',
          },
        }
      },
    }),

    complete_task: tool({
      description: 'Mark a task as complete (auto-executed, T0)',
      inputSchema: zodSchema(
        z.object({
          taskId: z.string().min(1),
        })
      ),
      execute: async ({ taskId }) => {
        requireEttaPermission(ctx, { wedding: ['update'] })
        const authz = requirePlannerAuthz(ctx)
        const task = await taskService.completeTask(authz, ctx.weddingId, taskId, true)

        await logAudit({
          weddingId: ctx.weddingId,
          actorId: ctx.ettaActorId,
          actorType: 'etta',
          action: 'complete_task',
          resourceType: 'task',
          resourceId: task.id,
          payload: { taskId: task.id, title: task.title },
        })

        return {
          message: `Task marked as complete: ${task.title}`,
          task,
        }
      },
    }),

    add_task: tool({
      description: 'Create a new checklist task for the wedding',
      inputSchema: zodSchema(
        z.object({
          title: z.string().min(1).max(200),
          category: taskCategorySchema,
          monthsBeforeWedding: z.number().int(),
          eventId: z.string().min(1).optional(),
          dueDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
          description: z.string().max(5000).nullable().optional(),
          notes: z.string().max(5000).nullable().optional(),
        })
      ),
      execute: async (input) => {
        requireEttaPermission(ctx, { wedding: ['update'] })
        const authz = requirePlannerAuthz(ctx)
        const task = await taskService.createTask(authz, ctx.weddingId, input)

        await logAudit({
          weddingId: ctx.weddingId,
          actorId: ctx.ettaActorId,
          actorType: 'etta',
          action: 'add_task',
          resourceType: 'task',
          resourceId: task.id,
          payload: {
            taskId: task.id,
            title: task.title,
            category: task.category,
          },
        })

        return {
          message: `Task created: ${task.title}`,
          task,
        }
      },
    }),
  }
}

const mapTaskStatus = (status?: 'active' | 'completed' | 'all'): boolean | undefined => {
  if (status === 'active') {
    return false
  }

  if (status === 'completed') {
    return true
  }

  return undefined
}
