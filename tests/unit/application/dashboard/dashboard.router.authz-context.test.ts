var mockGetOverviewForScopedWedding: jest.Mock

jest.mock('lib/auth', () => ({
  auth: { api: { getSession: jest.fn().mockResolvedValue(null) } },
}))

jest.mock('server/db', () => ({ db: {} }))
jest.mock('server/infrastructure/database', () => ({ db: {} }))
jest.mock('server/domains/event/event.repository', () => ({
  EventRepository: jest.fn().mockImplementation(() => ({})),
}))
jest.mock('server/domains/guest/guest.repository', () => ({
  GuestRepository: jest.fn().mockImplementation(() => ({})),
}))
jest.mock('server/domains/household/household.repository', () => ({
  HouseholdRepository: jest.fn().mockImplementation(() => ({})),
}))
jest.mock('server/domains/invitation/invitation.repository', () => ({
  InvitationRepository: jest.fn().mockImplementation(() => ({})),
}))
jest.mock('server/domains/question/question.repository', () => ({
  QuestionRepository: jest.fn().mockImplementation(() => ({})),
}))
jest.mock('server/domains/user/user.repository', () => ({
  UserRepository: jest.fn().mockImplementation(() => ({})),
}))
jest.mock('server/domains/website/website.repository', () => ({
  WebsiteRepository: jest.fn().mockImplementation(() => ({})),
}))
jest.mock('server/domains/wedding/wedding.repository', () => ({
  WeddingRepository: jest.fn().mockImplementation(() => ({})),
}))
jest.mock('server/application/dashboard/dashboard.service', () => ({
  __mock: (() => {
    mockGetOverviewForScopedWedding = jest.fn()
    return {
      getOverviewForScopedWedding: mockGetOverviewForScopedWedding,
    }
  })(),
  DashboardService: jest.fn().mockImplementation(() => ({
    getOverviewForScopedWedding: mockGetOverviewForScopedWedding,
  })),
}))

import { dashboardRouter } from 'server/application/dashboard/dashboard.router'

describe('dashboardRouter authz context plumbing', () => {
  beforeEach(() => {
    mockGetOverviewForScopedWedding.mockReset()
  })

  it('uses active scoped wedding for authenticated dashboard reads', async () => {
    mockGetOverviewForScopedWedding.mockResolvedValue({ totalGuests: 5 })

    const caller = dashboardRouter.createCaller({
      auth: {
        session: { user: { id: 'user-123' } },
        activeOrganization: { organizationId: 'org-123', role: 'owner' },
        activeWeddingId: 'wedding-123',
        userId: 'user-123',
      },
      authz: {
        userId: 'user-123',
        activeOrganization: { organizationId: 'org-123', role: 'owner' },
      },
      db: {} as never,
      headers: new Headers(),
    })

    await caller.getByUserId()

    expect(mockGetOverviewForScopedWedding).toHaveBeenCalledWith('user-123', 'wedding-123')
  })

  it('rejects unauthenticated requests with UNAUTHORIZED', async () => {
    const caller = dashboardRouter.createCaller({
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

    await expect(caller.getByUserId()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })
})
