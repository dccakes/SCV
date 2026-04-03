import type { DashboardData } from '~/server/application/dashboard/dashboard.types'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'

type DashboardOverviewReader = {
  getOverviewForScopedWedding(userId: string, weddingId: string): Promise<DashboardData | null>
}

export class DashboardOverviewUseCase {
  constructor(private dashboardReader: DashboardOverviewReader) {}

  async execute(input: {
    userId: string
    authz: AuthzContext
    activeWeddingId: string | null
  }): Promise<DashboardData | null> {
    requirePermission(input.authz, { wedding: ['read'] })
    if (!input.activeWeddingId) {
      return null
    }
    return this.dashboardReader.getOverviewForScopedWedding(input.userId, input.activeWeddingId)
  }
}
