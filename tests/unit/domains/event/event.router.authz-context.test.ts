jest.mock('lib/auth', () => ({
  auth: { api: { getSession: jest.fn().mockResolvedValue(null) } },
}))

jest.mock('server/db', () => ({ db: {} }))

jest.mock('server/domains/event', () => ({
  eventService: {
    createEvent: jest.fn(),
    deleteEvent: jest.fn(),
    getWeddingEvents: jest.fn(),
    getWeddingEventsWithStats: jest.fn(),
    updateCollectRsvp: jest.fn(),
    updateEvent: jest.fn(),
  },
}))

import { eventService } from 'server/domains/event'
import { eventRouter } from 'server/domains/event/event.router'

const mockCreateEvent = eventService.createEvent as jest.Mock
const mockUpdateEvent = eventService.updateEvent as jest.Mock
const mockDeleteEvent = eventService.deleteEvent as jest.Mock

describe('eventRouter authz context plumbing', () => {
  const activeOrganization = {
    organizationId: 'org-123',
    role: 'owner',
  }

  const caller = eventRouter.createCaller({
    auth: {
      session: { user: { id: 'user-123' } },
      activeOrganization,
      activeWeddingId: 'wedding-123',
      userId: 'user-123',
    },
    authz: {
      userId: 'user-123',
      activeOrganization,
    },
    db: {} as never,
    headers: new Headers(),
  })

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('passes authz context to create mutation service call', async () => {
    mockCreateEvent.mockResolvedValue({ id: 'event-1' })

    await caller.create({ eventName: 'Ceremony' })

    expect(mockCreateEvent).toHaveBeenCalledWith(
      {
        activeOrganization,
        userId: 'user-123',
      },
      'wedding-123',
      { allowTagAlongs: false, eventName: 'Ceremony' }
    )
  })

  it('passes authz context to update and delete mutation service calls', async () => {
    mockUpdateEvent.mockResolvedValue({ id: 'event-1' })
    mockDeleteEvent.mockResolvedValue('event-1')

    await caller.update({ eventId: 'event-1', eventName: 'Updated' })
    await caller.delete({ eventId: 'event-1' })

    expect(mockUpdateEvent).toHaveBeenCalledWith(
      {
        activeOrganization,
        userId: 'user-123',
      },
      'wedding-123',
      { allowTagAlongs: false, eventId: 'event-1', eventName: 'Updated' }
    )

    expect(mockDeleteEvent).toHaveBeenCalledWith(
      {
        activeOrganization,
        userId: 'user-123',
      },
      'wedding-123',
      'event-1'
    )
  })
})
