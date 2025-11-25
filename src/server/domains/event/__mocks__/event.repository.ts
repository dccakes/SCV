/**
 * Event Repository - Jest Manual Mock
 *
 * This mock is automatically used when jest.mock('~/server/domains/event/event.repository') is called.
 */

import { type Event } from '~/server/domains/event/event.types'

export const mockEvent: Event = {
  id: 'event-123',
  name: 'Wedding Day',
  date: new Date('2024-06-15'),
  startTime: '14:00',
  endTime: '16:00',
  venue: 'Beautiful Garden',
  attire: 'Formal',
  description: 'Our special day!',
  userId: 'user-123',
  collectRsvp: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockGuests = [
  { id: 1, firstName: 'Guest', lastName: 'One', userId: 'user-123' },
  { id: 2, firstName: 'Guest', lastName: 'Two', userId: 'user-123' },
]

export const mockFindById = jest.fn()
export const mockFindByIdWithQuestions = jest.fn()
export const mockFindByUserId = jest.fn()
export const mockFindByUserIdWithQuestions = jest.fn()
export const mockCreate = jest.fn()
export const mockUpdate = jest.fn()
export const mockUpdateCollectRsvp = jest.fn()
export const mockDelete = jest.fn()
export const mockExists = jest.fn()
export const mockBelongsToUser = jest.fn()

export const EventRepository = jest.fn().mockImplementation(() => ({
  findById: mockFindById,
  findByIdWithQuestions: mockFindByIdWithQuestions,
  findByUserId: mockFindByUserId,
  findByUserIdWithQuestions: mockFindByUserIdWithQuestions,
  create: mockCreate,
  update: mockUpdate,
  updateCollectRsvp: mockUpdateCollectRsvp,
  delete: mockDelete,
  exists: mockExists,
  belongsToUser: mockBelongsToUser,
}))

// Helper to reset all mocks
export const resetMocks = (): void => {
  mockFindById.mockReset()
  mockFindByIdWithQuestions.mockReset()
  mockFindByUserId.mockReset()
  mockFindByUserIdWithQuestions.mockReset()
  mockCreate.mockReset()
  mockUpdate.mockReset()
  mockUpdateCollectRsvp.mockReset()
  mockDelete.mockReset()
  mockExists.mockReset()
  mockBelongsToUser.mockReset()
  EventRepository.mockClear()
}
