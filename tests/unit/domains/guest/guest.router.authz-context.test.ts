import { TRPCError } from '@trpc/server'

jest.mock('lib/auth', () => ({
  auth: { api: { getSession: jest.fn().mockResolvedValue(null) } },
}))

jest.mock('~/lib/auth-permissions', () => require('~/lib/__mocks__/auth-permissions'))

jest.mock('server/db', () => ({ db: {} }))

jest.mock('server/application/guest-insights', () => ({
  guestInsightsService: {
    listEventInvitations: jest.fn(),
    listHouseholdGuests: jest.fn(),
    listGuests: jest.fn(),
  },
}))

jest.mock('server/application/guest-export', () => ({
  guestExportService: { getExportData: jest.fn() },
}))

import { guestExportService } from 'server/application/guest-export'
import { guestInsightsService } from 'server/application/guest-insights'
import { guestRouter } from 'server/domains/guest/guest.router'

const mockListEventInvitations = guestInsightsService.listEventInvitations as jest.Mock
const mockListHouseholdGuests = guestInsightsService.listHouseholdGuests as jest.Mock
const mockListGuests = guestInsightsService.listGuests as jest.Mock
const mockGetExportData = guestExportService.getExportData as jest.Mock

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
    mockListEventInvitations.mockResolvedValue([{ id: 'inv-1' }])
    mockListHouseholdGuests.mockResolvedValue({ id: 'household-1', guests: [{ id: 1 }] })
    mockListGuests.mockResolvedValue([{ id: 1 }])

    await caller.getAllByEventId({ eventId: 'event-1' })
    await caller.getAllByHouseholdId({ householdId: 'household-1' })
    await caller.getAllByUserId()

    expect(mockListEventInvitations).toHaveBeenCalledWith(
      { userId: 'user-123', activeOrganization },
      'wedding-123',
      'event-1'
    )
    expect(mockListHouseholdGuests).toHaveBeenCalledWith(
      { userId: 'user-123', activeOrganization },
      'wedding-123',
      'household-1'
    )
    expect(mockListGuests).toHaveBeenCalledWith(
      { userId: 'user-123', activeOrganization },
      'wedding-123'
    )
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
    const forbiddenError = new TRPCError({ code: 'FORBIDDEN' })
    mockListEventInvitations.mockRejectedValue(forbiddenError)
    mockListHouseholdGuests.mockRejectedValue(forbiddenError)
    mockListGuests.mockRejectedValue(forbiddenError)

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

  it('scopes the guest export to the active wedding', async () => {
    mockGetExportData.mockResolvedValue({ guests: [] })

    await expect(caller.getExportData()).resolves.toEqual({ guests: [] })
    expect(mockGetExportData).toHaveBeenCalledWith(
      { userId: 'user-123', activeOrganization },
      'wedding-123'
    )
  })

  it('passes a FORBIDDEN export through to the client', async () => {
    mockGetExportData.mockRejectedValue(new TRPCError({ code: 'FORBIDDEN' }))

    await expect(caller.getExportData()).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('rejects the guest export when there is no active wedding', async () => {
    const noWeddingCaller = guestRouter.createCaller({
      auth: {
        session: { user: { id: 'user-123' } },
        activeOrganization,
        activeWeddingId: null,
        userId: 'user-123',
      },
      authz: { userId: 'user-123', activeOrganization },
      db: {} as never,
      headers: new Headers(),
    })

    await expect(noWeddingCaller.getExportData()).rejects.toBeInstanceOf(TRPCError)
    expect(mockGetExportData).not.toHaveBeenCalled()
  })
})
