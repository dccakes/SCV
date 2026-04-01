/**
 * Event Domain - Jest Manual Mock (barrel index)
 *
 * Mocks eventService singleton.
 * Used when jest.mock('~/server/domains/event') is called.
 */

export const eventService = {
  createEvent: jest.fn(),
  getById: jest.fn(),
  getWeddingEvents: jest.fn(),
  getWeddingEventsWithStats: jest.fn(),
  updateEvent: jest.fn(),
  updateCollectRsvp: jest.fn(),
  deleteEvent: jest.fn(),
}

export const resetMocks = (): void => {
  for (const fn of Object.values(eventService)) {
    ;(fn as jest.Mock).mockReset()
  }
}
