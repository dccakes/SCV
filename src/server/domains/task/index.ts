import { TaskRepository } from '~/server/domains/task/task.repository'
import { TaskService } from '~/server/domains/task/task.service'
import { db } from '~/server/infrastructure/database'

const taskRepository = new TaskRepository(db)
export const taskService = new TaskService(taskRepository)

export { TaskRepository } from '~/server/domains/task/task.repository'
export { TaskService } from '~/server/domains/task/task.service'
export type {
  Task,
  TaskCreateData,
  TaskListFilters,
  TaskPriorityQueueResult,
  TaskUpdateData,
} from '~/server/domains/task/task.types'
export {
  type CompleteTaskInput,
  type CreateTaskInput,
  completeTaskSchema,
  createTaskSchema,
  type DeleteTaskInput,
  deleteTaskSchema,
  type GetPriorityQueueInput,
  type GetTaskInput,
  getPriorityQueueSchema,
  getTaskSchema,
  type ListTasksInput,
  listTasksSchema,
  type UpdateTaskInput,
  updateTaskSchema,
} from '~/server/domains/task/task.validator'
