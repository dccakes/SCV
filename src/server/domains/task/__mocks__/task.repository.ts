import { TaskCategory } from '@prisma/client'

import type { Task } from '~/server/domains/task/task.types'

export const mockTask: Task = {
  id: 'task-123',
  weddingId: 'wedding-123',
  eventId: 'event-123',
  vendorId: null,
  milestoneId: null,
  seedKey: null,
  title: 'Book florist',
  category: TaskCategory.VENDORS,
  monthsBeforeWedding: 6,
  dueDate: new Date('2026-05-01T00:00:00.000Z'),
  description: 'Compare florist quotes',
  notes: null,
  isDefault: false,
  position: 0,
  completed: false,
  completedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
}

export const mockFindById = jest.fn()
export const mockFindByWeddingId = jest.fn()
export const mockFindPriorityQueueCandidates = jest.fn()
export const mockCreate = jest.fn()
export const mockUpdate = jest.fn()
export const mockDelete = jest.fn()
export const mockBelongsToWedding = jest.fn()
export const mockEventBelongsToWedding = jest.fn()
export const mockFindFirstEventId = jest.fn()

export const TaskRepository = jest.fn().mockImplementation(() => ({
  findById: mockFindById,
  findByWeddingId: mockFindByWeddingId,
  findPriorityQueueCandidates: mockFindPriorityQueueCandidates,
  create: mockCreate,
  update: mockUpdate,
  delete: mockDelete,
  belongsToWedding: mockBelongsToWedding,
  eventBelongsToWedding: mockEventBelongsToWedding,
  findFirstEventId: mockFindFirstEventId,
}))

export const resetMocks = (): void => {
  mockFindById.mockReset()
  mockFindByWeddingId.mockReset()
  mockFindPriorityQueueCandidates.mockReset()
  mockCreate.mockReset()
  mockUpdate.mockReset()
  mockDelete.mockReset()
  mockBelongsToWedding.mockReset()
  mockEventBelongsToWedding.mockReset()
  mockFindFirstEventId.mockReset()
  TaskRepository.mockClear()
}
