import { redirect } from 'next/navigation'

import { getDashboardOverview } from '~/server/application/dashboard/dashboard-request-data'
import { isAccessError } from '~/server/authz/auth-error-helpers'
import { api } from '~/trpc/server'

export async function getRequiredDashboardOverview() {
  let dashboardData: Awaited<ReturnType<typeof getDashboardOverview>>

  try {
    dashboardData = await getDashboardOverview()
  } catch (error) {
    if (isAccessError(error)) {
      redirect('/')
    }
    throw error
  }

  if (!dashboardData) {
    redirect('/')
  }

  return dashboardData
}

export async function getRequiredWedding() {
  let wedding: Awaited<ReturnType<typeof api.wedding.getActive>>

  try {
    wedding = await api.wedding.getActive()
  } catch (error) {
    if (isAccessError(error)) {
      redirect('/')
    }
    throw error
  }

  if (!wedding) {
    redirect('/')
  }

  return wedding
}
