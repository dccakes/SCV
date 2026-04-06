import { TRPCError } from '@trpc/server'
import { DashboardOverviewUseCase } from '~/server/application/dashboard/dashboard-overview.use-case'
import type { AuthzContext } from '~/server/authz/authorization.types'

jest.mock('~/lib/auth-permissions', () => require('~/lib/__mocks__/auth-permissions'))

describe('DashboardOverviewUseCase', () => {
  const buildAuthz = (role: 'owner' | 'admin' | 'member' | 'viewer'): AuthzContext => ({
    userId: 'user-1',
    activeOrganization: { organizationId: 'org-1', role },
  })

  it('returns null when no active wedding is scoped', async () => {
    const dashboardService = {
      getOverviewForScopedWedding: jest.fn(),
    }
    const useCase = new DashboardOverviewUseCase(dashboardService)

    const result = await useCase.execute({
      userId: 'user-1',
      authz: buildAuthz('owner'),
      activeWeddingId: null,
    })

    expect(result).toBeNull()
    expect(dashboardService.getOverviewForScopedWedding).not.toHaveBeenCalled()
  })

  it('delegates to dashboard service when scoped wedding exists', async () => {
    const dashboardService = {
      getOverviewForScopedWedding: jest.fn().mockResolvedValue({ totalGuests: 3 }),
    }
    const useCase = new DashboardOverviewUseCase(dashboardService)

    await useCase.execute({
      userId: 'user-1',
      authz: buildAuthz('member'),
      activeWeddingId: 'wedding-1',
    })

    expect(dashboardService.getOverviewForScopedWedding).toHaveBeenCalledWith('user-1', 'wedding-1')
  })

  it('rejects viewer access', async () => {
    const dashboardService = {
      getOverviewForScopedWedding: jest.fn(),
    }
    const useCase = new DashboardOverviewUseCase(dashboardService)

    await expect(
      useCase.execute({
        userId: 'user-1',
        authz: buildAuthz('viewer'),
        activeWeddingId: 'wedding-1',
      })
    ).rejects.toThrow(TRPCError)
  })
})
