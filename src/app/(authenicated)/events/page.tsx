/**
 * Events Page
 *
 * Displays all events for the current user's wedding.
 * Events are ordered by creation date (oldest first).
 */

import { EventsPageClient } from '@/app/(authenicated)/events/_components/events-page-client'
import { getRequiredWedding } from '~/server/application/authenticated-route/authenticated-route-data'

export default async function EventsPage() {
  await getRequiredWedding()

  return (
    <div className='container mx-auto px-4 py-6 md:py-8'>
      <div className='mb-6 md:mb-8'>
        <h1 className='font-bold text-2xl tracking-tight md:text-3xl'>Events</h1>
        <p className='mt-1 text-muted-foreground text-sm md:mt-2 md:text-base'>
          Manage your wedding events and ceremonies
        </p>
      </div>

      <EventsPageClient />
    </div>
  )
}
