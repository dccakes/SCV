import type { Task as PrismaTask, TaskCategory } from '@prisma/client'

export type Task = PrismaTask

export type TaskListFilters = {
  category?: TaskCategory
  eventId?: string
  completed?: boolean
}

export type TaskCreateData = {
  weddingId: string
  eventId: string
  vendorId?: string | null
  milestoneId?: string | null
  seedKey?: string | null
  title: string
  category: TaskCategory
  monthsBeforeWedding: number
  dueDate?: Date | null
  description?: string | null
  notes?: string | null
  isDefault?: boolean
  position?: number
  completed?: boolean
  completedAt?: Date | null
}

export type TaskUpdateData = {
  eventId?: string
  vendorId?: string | null
  milestoneId?: string | null
  title?: string
  category?: TaskCategory
  monthsBeforeWedding?: number
  dueDate?: Date | null
  description?: string | null
  notes?: string | null
  position?: number
  completed?: boolean
  completedAt?: Date | null
}

// targetDate is the explicit due date, or one derived from the wedding date and lead time.
export type PriorityTask = Task & { targetDate: Date | null }

export type TaskPriorityQueueResult = {
  tasks: PriorityTask[]
  totalActive: number
}
