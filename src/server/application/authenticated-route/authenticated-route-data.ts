import { redirect } from 'next/navigation'

import { getDashboardOverview } from '~/server/application/dashboard/dashboard-request-data'
import { api } from '~/trpc/server'

export async function getRequiredDashboardOverview() {
  const dashboardData = await getDashboardOverview()

  if (!dashboardData) {
    redirect('/')
  }

  return dashboardData
}

export async function getRequiredWedding() {
  const wedding = await api.wedding.getByUserId.query()

  if (!wedding) {
    redirect('/')
  }

  return wedding
}
