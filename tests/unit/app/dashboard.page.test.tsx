jest.mock('~/components/dashboard/dashboard-topbar', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('~/components/dashboard/planning-overview', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('~/server/application/authenticated-route/authenticated-route-data', () => ({
  getRequiredDashboardOverview: () => Promise.resolve({}),
}))

import * as DashboardPageModule from '~/app/(authenicated)/dashboard/page'

describe('DashboardPage module', () => {
  it('marks dashboard route as force-dynamic', () => {
    expect(DashboardPageModule.dynamic).toBe('force-dynamic')
  })
})
