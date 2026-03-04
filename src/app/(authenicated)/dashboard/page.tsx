import DashboardTopbar from '@/components/dashboard/dashboard-topbar'
import PlanningOverview from '@/components/dashboard/planning-overview'
import { api } from '~/trpc/server'

export default async function MePage() {
  const dashboardData = await api.dashboard.getByUserId.query()

  return (
    <>
    <DashboardTopbar />
    <div className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
      <PlanningOverview dashboardData={dashboardData} />
    </div>
  </>
  )
}
