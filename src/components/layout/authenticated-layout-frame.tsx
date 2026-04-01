import type { ReactNode } from 'react'
import AuthenticatedAppShell from '@/components/layout/authenticated-app-shell'
import { getSidebarWeddingInfo } from '@/components/old_dashboard/sidebar-wedding-info'
import { getDashboardOverview } from '~/server/application/dashboard/dashboard-request-data'

type AuthenticatedLayoutFrameProps = {
  children: ReactNode
  showEttaPanel?: boolean
}

export async function AuthenticatedLayoutFrame(props: Readonly<AuthenticatedLayoutFrameProps>) {
  const { children, showEttaPanel = false } = props
  const dashboardData = await getDashboardOverview()
  const { coupleName, weddingDate, weddingLocation } = getSidebarWeddingInfo(
    dashboardData?.weddingData
  )

  return (
    <AuthenticatedAppShell
      coupleName={coupleName}
      weddingDate={weddingDate}
      weddingLocation={weddingLocation}
      showEttaPanel={showEttaPanel}
    >
      {children}
    </AuthenticatedAppShell>
  )
}
