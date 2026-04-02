import type { ReactNode } from 'react'
import AuthenticatedAppShell from '@/components/layout/authenticated-app-shell'
import { getSidebarWeddingInfo } from '@/components/old_dashboard/sidebar-wedding-info'
import { getDashboardOverview } from '~/server/application/dashboard/dashboard-request-data'
import { api } from '~/trpc/server'

type AuthenticatedLayoutFrameProps = {
  children: ReactNode
  showEttaPanel?: boolean
}

export async function AuthenticatedLayoutFrame(props: Readonly<AuthenticatedLayoutFrameProps>) {
  const { children, showEttaPanel = false } = props
  const dashboardData = await getDashboardOverview()
  const isEttaConfigured = Boolean(process.env.AI_GATEWAY_API_KEY)
  const { coupleName, weddingDate, weddingLocation } = getSidebarWeddingInfo(
    dashboardData?.weddingData
  )

  let weddingId: string | undefined
  if (showEttaPanel) {
    const wedding = await api.wedding.getByUserId()
    weddingId = wedding?.id
  }

  return (
    <AuthenticatedAppShell
      coupleName={coupleName}
      weddingDate={weddingDate}
      weddingLocation={weddingLocation}
      showEttaPanel={showEttaPanel}
      weddingId={weddingId}
      isEttaConfigured={isEttaConfigured}
    >
      {children}
    </AuthenticatedAppShell>
  )
}
