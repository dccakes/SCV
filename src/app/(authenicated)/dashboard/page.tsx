import type { Metadata } from 'next'

import DashboardTopbar from '@/components/dashboard/dashboard-topbar'
import PlanningOverview from '@/components/dashboard/planning-overview'
import { PageContent } from '~/components/layout/page-content'
import { getRequiredDashboardOverview } from '~/server/application/authenticated-route/authenticated-route-data'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard | Your Wedding Website',
  description: 'Your wedding planning overview — track RSVPs, tasks, vendors, and milestones.',
}

export default async function DashboardPage() {
  const dashboardData = await getRequiredDashboardOverview()

  return (
    <>
      <DashboardTopbar />
      <PageContent>
        <PlanningOverview dashboardData={dashboardData} />
      </PageContent>
    </>
  )
}
