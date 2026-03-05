import { cache } from 'react'

import type { DashboardData } from '~/server/application/dashboard/dashboard.types'
import { api } from '~/trpc/server'

export const createDashboardOverviewLoader = () =>
  cache(async (): Promise<DashboardData | null> => api.dashboard.getByUserId.query())

export const getDashboardOverview = createDashboardOverviewLoader()
