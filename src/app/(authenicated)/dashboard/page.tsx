import DashboardTopbar from '@/components/dashboard/dashboard-topbar'
import PlanningOverview from '@/components/dashboard/planning-overview'
import { getRequiredWedding } from '~/server/application/authenticated-route/authenticated-route-data'

export const dynamic = 'force-dynamic'

export default async function MePage() {
  // Lightweight guard: redirects to / if no active wedding
  await getRequiredWedding()

  return (
    <>
      <DashboardTopbar />
      <div className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
        <PlanningOverview />
      </div>
    </>
  )
}
