import { TaskCategory } from '@prisma/client'
import { z } from 'zod'

const isValidTaskDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const parsedDate = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1))

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === (month ?? 1) - 1 &&
    parsedDate.getUTCDate() === day
  )
}

const taskDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(isValidTaskDate, 'Date must be a real calendar date')

const nullableTaskFieldSchema = z.string().min(1).nullable().optional()
const nullableTaskTextSchema = z.string().max(5000).nullable().optional()

const taskIdSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
})

export const createTaskSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required').optional(),
  vendorId: nullableTaskFieldSchema,
  milestoneId: nullableTaskFieldSchema,
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(200, 'Task title must be 200 characters or less'),
  category: z.enum(TaskCategory),
  monthsBeforeWedding: z.number().int(),
  dueDate: taskDateSchema.nullable().optional(),
  description: nullableTaskTextSchema,
  notes: nullableTaskTextSchema,
  position: z.number().int().min(0).optional(),
})

export const updateTaskSchema = taskIdSchema.extend({
  eventId: z.string().min(1, 'Event ID is required').optional(),
  vendorId: nullableTaskFieldSchema,
  milestoneId: nullableTaskFieldSchema,
  title: z.string().min(1).max(200).optional(),
  category: z.enum(TaskCategory).optional(),
  monthsBeforeWedding: z.number().int().optional(),
  dueDate: taskDateSchema.nullable().optional(),
  description: nullableTaskTextSchema,
  notes: nullableTaskTextSchema,
  position: z.number().int().min(0).optional(),
})

export const listTasksSchema = z.object({
  category: z.enum(TaskCategory).optional(),
  eventId: z.string().min(1, 'Event ID is required').optional(),
  completed: z.boolean().optional(),
})

export const getTaskSchema = taskIdSchema

export const deleteTaskSchema = taskIdSchema

export const completeTaskSchema = taskIdSchema.extend({
  completed: z.boolean().default(true),
})

export const getPriorityQueueSchema = z.object({})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type ListTasksInput = z.infer<typeof listTasksSchema>
export type GetTaskInput = z.infer<typeof getTaskSchema>
export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>
export type CompleteTaskInput = z.infer<typeof completeTaskSchema>
export type GetPriorityQueueInput = z.infer<typeof getPriorityQueueSchema>
