/**
 * Event Service - Jest Manual Mock
 *
 * This mock is automatically used when jest.mock('~/server/domains/event/event.service') is called.
 */

export const mockCreateEvent = jest.fn()
export const mockGetById = jest.fn()
export const mockGetAllByWeddingId = jest.fn()
export const mockUpdateEvent = jest.fn()
export const mockDeleteEvent = jest.fn()
export const mockUpdateCollectRsvp = jest.fn()

export const EventService = jest.fn().mockImplementation(() => ({
  createEvent: mockCreateEvent,
  getById: mockGetById,
  getAllByWeddingId: mockGetAllByWeddingId,
  updateEvent: mockUpdateEvent,
  deleteEvent: mockDeleteEvent,
  updateCollectRsvp: mockUpdateCollectRsvp,
}))

// Helper to reset all mocks
export const resetMocks = (): void => {
  mockCreateEvent.mockReset()
  mockGetById.mockReset()
  mockGetAllByWeddingId.mockReset()
  mockUpdateEvent.mockReset()
  mockDeleteEvent.mockReset()
  mockUpdateCollectRsvp.mockReset()
  EventService.mockClear()
}
