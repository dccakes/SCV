import type { ReactNode } from 'react'

import DashboardShell from '~/app/_components/dashboard/dashboard-shell'
import { getSidebarWeddingInfo } from '~/app/_components/dashboard/sidebar-wedding-info'
import { api } from '~/trpc/server'

type AppLayoutShellProps = {
  children: ReactNode
}

export async function AppLayoutShell({ children }: Readonly<AppLayoutShellProps>) {
  const dashboardData = await api.dashboard.getByUserId.query()
  const { coupleName, weddingDate } = getSidebarWeddingInfo(dashboardData?.weddingData)

  return (
    <DashboardShell coupleName={coupleName} weddingDate={weddingDate}>
      {children}
    </DashboardShell>
  )
}
