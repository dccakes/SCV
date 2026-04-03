jest.mock('lib/auth', () => ({
  auth: { api: { getSession: jest.fn().mockResolvedValue(null) } },
}))

jest.mock('~/lib/auth-permissions', () => require('~/lib/__mocks__/auth-permissions'))

jest.mock('server/db', () => ({ db: {} }))

jest.mock('server/domains/guest', () => ({
  guestService: {
    getAllByHouseholdId: jest.fn(),
    getAllByWeddingId: jest.fn(),
  },
}))

jest.mock('server/domains/invitation', () => ({
  invitationService: {
    getByEventIdInWedding: jest.fn(),
  },
}))

import { guestService } from 'server/domains/guest'
import { guestRouter } from 'server/domains/guest/guest.router'
import { invitationService } from 'server/domains/invitation'

const mockGetAllByHouseholdId = guestService.getAllByHouseholdId as jest.Mock
const mockGetAllByWeddingId = guestService.getAllByWeddingId as jest.Mock
const mockGetByEventIdInWedding = invitationService.getByEventIdInWedding as jest.Mock

describe('guestRouter authz context plumbing', () => {
  const activeOrganization = {
    organizationId: 'org-123',
    role: 'owner',
  }

  const caller = guestRouter.createCaller({
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

  it('keeps read routes scoped to active wedding', async () => {
    mockGetByEventIdInWedding.mockResolvedValue([{ id: 'inv-1' }])
    mockGetAllByHouseholdId.mockResolvedValue([{ id: 1, weddingId: 'wedding-123' }])
    mockGetAllByWeddingId.mockResolvedValue([{ id: 1 }])

    await caller.getAllByEventId({ eventId: 'event-1' })
    await caller.getAllByHouseholdId({ householdId: 'household-1' })
    await caller.getAllByUserId()

    expect(mockGetByEventIdInWedding).toHaveBeenCalledWith('event-1', 'wedding-123')
    expect(mockGetAllByHouseholdId).toHaveBeenCalledWith('household-1')
    expect(mockGetAllByWeddingId).toHaveBeenCalledWith('wedding-123')
  })

  it('rejects unauthenticated reads with UNAUTHORIZED', async () => {
    const unauthenticatedCaller = guestRouter.createCaller({
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

    await expect(
      unauthenticatedCaller.getAllByEventId({
        eventId: 'event-1',
      })
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })

  it('rejects viewer guest reads with FORBIDDEN', async () => {
    const viewerCaller = guestRouter.createCaller({
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

    await expect(
      viewerCaller.getAllByEventId({
        eventId: 'event-1',
      })
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })

    await expect(
      viewerCaller.getAllByHouseholdId({
        householdId: 'household-1',
      })
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })

    await expect(viewerCaller.getAllByUserId()).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })
})
