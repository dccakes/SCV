import type { ReactNode } from 'react'

import { getSidebarWeddingInfo } from '@/app/_components/old_dashboard/sidebar-wedding-info'
import AuthenticatedAppShell from '@/components/layout/authenticated-app-shell'
import { api } from '~/trpc/server'

type AuthenticatedLayoutFrameProps = {
  children: ReactNode
  showEttaPanel?: boolean
}

export async function AuthenticatedLayoutFrame(props: Readonly<AuthenticatedLayoutFrameProps>) {
  const { children, showEttaPanel = false } = props
  const dashboardData = await api.dashboard.getByUserId.query()
  const { coupleName, weddingDate } = getSidebarWeddingInfo(dashboardData?.weddingData)

  return (
    <AuthenticatedAppShell
      coupleName={coupleName}
      weddingDate={weddingDate}
      showEttaPanel={showEttaPanel}
    >
      {children}
    </AuthenticatedAppShell>
  )
}
