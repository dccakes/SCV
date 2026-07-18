import type { Metadata } from 'next'
import { Suspense } from 'react'
import DashboardTopbar from '~/components/dashboard/dashboard-topbar'
import GuestList from '~/components/guest-list'
import { GuestListSkeleton } from '~/components/guest-list/guest-list-skeleton'
import { PageContent } from '~/components/layout/page-content'
import { getRequiredDashboardOverview } from '~/server/application/authenticated-route/authenticated-route-data'

export const metadata: Metadata = {
  title: 'Guest List | Your Wedding Website',
  description: 'Manage guests, households, and RSVP details',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export default async function GuestListPage() {
  const dashboardData = await getRequiredDashboardOverview()

  return (
    <>
      <DashboardTopbar title='Guest List' showManagementActions={false} />
      <PageContent>
        <Suspense fallback={<GuestListSkeleton />}>
          <GuestList dashboardData={dashboardData} />
        </Suspense>
      </PageContent>
    </>
  )
}
