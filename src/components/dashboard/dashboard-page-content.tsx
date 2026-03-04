'use client'

import DashboardTopbar from '@/components/dashboard/dashboard-topbar'
import PlanningOverview from '@/components/dashboard/planning-overview'
import { useAuthenticatedSidebar } from '@/components/layout/authenticated-app-shell'
import type { DashboardData } from '~/app/utils/shared-types'

type MePageContentProps = Readonly<{
  dashboardData: DashboardData | null
}>

export default function MePageContent({ dashboardData }: MePageContentProps) {
  const { openSidebar } = useAuthenticatedSidebar()

  return (
    <>
      <DashboardTopbar onMenuToggle={openSidebar} />
      <div className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
        <PlanningOverview dashboardData={dashboardData} />
      </div>
    </>
  )
}
