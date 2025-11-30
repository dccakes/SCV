/**
 * Event Repository - Jest Manual Mock
 *
 * This mock is automatically used when jest.mock('~/server/domains/event/event.repository') is called.
 */

import { type Event, type EventWithStats } from '~/server/domains/event/event.types'

export const mockEvent: Event = {
  id: 'event-123',
  name: 'Wedding Day',
  date: new Date('2024-06-15'),
  startTime: '14:00',
  endTime: '16:00',
  venue: 'Beautiful Garden',
  attire: 'Formal',
  description: 'Our special day!',
  weddingId: 'wedding-123',
  collectRsvp: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockEventWithStats: EventWithStats = {
  ...mockEvent,
  guestResponses: {
    attending: 5,
    invited: 8,
    declined: 2,
    notInvited: 3,
  },
}

export const mockGuests = [
  { id: 1, firstName: 'Guest', lastName: 'One', weddingId: 'wedding-123' },
  { id: 2, firstName: 'Guest', lastName: 'Two', weddingId: 'wedding-123' },
]

export const mockFindById = jest.fn()
export const mockFindByIdWithQuestions = jest.fn()
export const mockFindByWeddingId = jest.fn()
export const mockFindByWeddingIdWithQuestions = jest.fn()
export const mockFindByWeddingIdWithStats = jest.fn()
export const mockCreate = jest.fn()
export const mockUpdate = jest.fn()
export const mockUpdateCollectRsvp = jest.fn()
export const mockDelete = jest.fn()
export const mockExists = jest.fn()
export const mockBelongsToWedding = jest.fn()

export const EventRepository = jest.fn().mockImplementation(() => ({
  findById: mockFindById,
  findByIdWithQuestions: mockFindByIdWithQuestions,
  findByWeddingId: mockFindByWeddingId,
  findByWeddingIdWithQuestions: mockFindByWeddingIdWithQuestions,
  findByWeddingIdWithStats: mockFindByWeddingIdWithStats,
  create: mockCreate,
  update: mockUpdate,
  updateCollectRsvp: mockUpdateCollectRsvp,
  delete: mockDelete,
  exists: mockExists,
  belongsToWedding: mockBelongsToWedding,
}))

// Helper to reset all mocks
export const resetMocks = (): void => {
  mockFindById.mockReset()
  mockFindByIdWithQuestions.mockReset()
  mockFindByWeddingId.mockReset()
  mockFindByWeddingIdWithQuestions.mockReset()
  mockFindByWeddingIdWithStats.mockReset()
  mockCreate.mockReset()
  mockUpdate.mockReset()
  mockUpdateCollectRsvp.mockReset()
  mockDelete.mockReset()
  mockExists.mockReset()
  mockBelongsToWedding.mockReset()
  EventRepository.mockClear()
}
