jest.mock('lib/auth', () => ({
  auth: { api: { getSession: jest.fn().mockResolvedValue(null) } },
}))

jest.mock('~/lib/auth-permissions', () => require('~/lib/__mocks__/auth-permissions'))

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
const mockGetWeddingEvents = eventService.getWeddingEvents as jest.Mock
const mockGetWeddingEventsWithStats = eventService.getWeddingEventsWithStats as jest.Mock
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

  it('keeps read routes protected and scoped to active wedding', async () => {
    mockGetWeddingEvents.mockResolvedValue([{ id: 'event-1' }])
    mockGetWeddingEventsWithStats.mockResolvedValue([{ id: 'event-1', guestResponses: {} }])

    await caller.getAllByUserId()
    await caller.getAllByUserIdWithStats()

    expect(mockGetWeddingEvents).toHaveBeenCalledWith('wedding-123')
    expect(mockGetWeddingEventsWithStats).toHaveBeenCalledWith('wedding-123')
  })

  it('rejects unauthenticated reads with UNAUTHORIZED', async () => {
    const unauthenticatedCaller = eventRouter.createCaller({
      auth: {
        session: null,
        activeOrganization: null,
        activeWeddingId: 'wedding-123',
        userId: null,
      },
      authz: {
        userId: '',
        activeOrganization: null,
      },
      db: {} as never,
      headers: new Headers(),
    })

    await expect(unauthenticatedCaller.getAllByUserId()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })

  it('rejects viewer read access with FORBIDDEN', async () => {
    const viewerCaller = eventRouter.createCaller({
      auth: {
        session: { user: { id: 'user-123' } },
        activeOrganization: { organizationId: 'org-123', role: 'viewer' },
        activeWeddingId: 'wedding-123',
        userId: 'user-123',
      },
      authz: {
        userId: 'user-123',
        activeOrganization: { organizationId: 'org-123', role: 'viewer' },
      },
      db: {} as never,
      headers: new Headers(),
    })

    await expect(viewerCaller.getAllByUserId()).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })
})
