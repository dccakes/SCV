import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import GuestList from '~/app/_components/guest-list'
import { sharedStyles } from '~/app/utils/shared-styles'
import { api } from '~/trpc/server'

export default async function DashboardPage() {
  const dashboardData = await api.dashboard.getByUserId.query()

  if (dashboardData === null) {
    redirect('/')
  }

  return (
    <main className={`${sharedStyles.desktopPaddingSidesGuestList}`}>
      <Suspense fallback={<div>Loading guest list...</div>}>
        <GuestList dashboardData={dashboardData} />
      </Suspense>
    </main>
  )
}
