import { createDashboardOverviewLoader } from '~/server/application/dashboard/dashboard-request-data'
import { api } from '~/trpc/server'

jest.mock('~/trpc/server', () => ({
  api: {
    dashboard: {
      getByUserId: {
        query: jest.fn(),
      },
    },
  },
}))

const mockDashboardQuery = api.dashboard.getByUserId.query as jest.Mock

describe('dashboard request data loader', () => {
  beforeEach(() => {
    mockDashboardQuery.mockReset()
  })

  it('returns dashboard data from tRPC query', async () => {
    const expected = { totalGuests: 5 } as unknown
    mockDashboardQuery.mockResolvedValue(expected)
    const getDashboardOverview = createDashboardOverviewLoader()

    const result = await getDashboardOverview()

    expect(result).toEqual(expected)
  })

  it('returns null when tRPC query returns null', async () => {
    mockDashboardQuery.mockResolvedValue(null)
    const getDashboardOverview = createDashboardOverviewLoader()

    const result = await getDashboardOverview()

    expect(result).toBeNull()
  })
})
