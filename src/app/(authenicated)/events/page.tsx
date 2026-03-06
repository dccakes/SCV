/**
 * Events Page
 *
 * Displays all events for the current user's wedding.
 * Events are ordered by creation date (oldest first).
 */

import type { Metadata } from 'next'

import { EventsPageClient } from '@/app/(authenicated)/events/_components/events-page-client'
import DashboardTopbar from '~/components/dashboard/dashboard-topbar'
import { getRequiredWedding } from '~/server/application/authenticated-route/authenticated-route-data'
import { api } from '~/trpc/server'

export const metadata: Metadata = {
  title: 'Events | Your Wedding Website',
  description: 'Manage your wedding events and ceremonies',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export default async function EventsPage() {
  await getRequiredWedding()
  const initialEvents = (await api.event.getAllByUserIdWithStats.query()) ?? []

  return (
    <>
      <DashboardTopbar title='Events' showManagementActions={false} />
      <main className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
        <EventsPageClient initialEvents={initialEvents} />
      </main>
    </>
  )
}
