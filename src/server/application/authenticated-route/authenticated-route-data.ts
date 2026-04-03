import { redirect } from 'next/navigation'

import { getDashboardOverview } from '~/server/application/dashboard/dashboard-request-data'
import { api } from '~/trpc/server'

const ACCESS_ERROR_CODES = new Set([
  'FORBIDDEN',
  'UNAUTHORIZED',
  'PRECONDITION_FAILED',
  'NOT_FOUND',
])

function getErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') {
    return null
  }

  const candidate = (error as { code?: unknown }).code
  return typeof candidate === 'string' ? candidate : null
}

export async function getRequiredDashboardOverview() {
  let dashboardData: Awaited<ReturnType<typeof getDashboardOverview>>

  try {
    dashboardData = await getDashboardOverview()
  } catch (error) {
    if (ACCESS_ERROR_CODES.has(getErrorCode(error) ?? '')) {
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
    if (ACCESS_ERROR_CODES.has(getErrorCode(error) ?? '')) {
      redirect('/')
    }
    throw error
  }

  if (!wedding) {
    redirect('/')
  }

  return wedding
}
