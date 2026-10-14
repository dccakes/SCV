/**
 * Seating Chart Page
 *
 * Drag and drop seating chart builder, one floor plan per event.
 */

import type { Metadata } from 'next'

import DashboardTopbar from '~/components/dashboard/dashboard-topbar'
import { SeatingChartBuilder } from '~/components/seating-chart/seating-chart-builder'
import { getRequiredWedding } from '~/server/application/authenticated-route/authenticated-route-data'
import { api } from '~/trpc/server'

export const metadata: Metadata = {
  title: 'Seating Chart | Your Wedding Website',
  description: 'Arrange tables and seat your guests',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

type SeatingPageSearchParams = {
  eventId?: string
}

export default async function SeatingPage(props: {
  searchParams?: Promise<SeatingPageSearchParams>
}) {
  const searchParams = (await props.searchParams) ?? {}
  await getRequiredWedding()
  const events = ((await api.event.getAllByUserId()) ?? []).map((event) => ({
    id: event.id,
    name: event.name,
  }))
  const initialEventId = events.find((event) => event.id === searchParams.eventId)?.id ?? null

  return (
    <>
      <DashboardTopbar title='Seating Chart' showManagementActions={false} />
      <main className='flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
        <SeatingChartBuilder events={events} initialEventId={initialEventId} />
      </main>
    </>
  )
}
