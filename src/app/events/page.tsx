/**
 * Events Page
 *
 * Displays all events for the current user's wedding.
 * Events are ordered by creation date (oldest first).
 */

import { redirect } from 'next/navigation'

import { EventsPageClient } from '~/app/events/_components/events-page-client'
import { api } from '~/trpc/server'

export default async function EventsPage() {
  // Fetch wedding to ensure user has completed onboarding
  const wedding = await api.wedding.getByUserId.query()

  if (!wedding) {
    redirect('/')
  }

  // Fetch all events for the wedding
  const events = await api.event.getAllByUserId.query()

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Events</h1>
        <p className="mt-1 text-sm text-muted-foreground md:mt-2 md:text-base">
          Manage your wedding events and ceremonies
        </p>
      </div>

      <EventsPageClient events={events ?? []} />
    </div>
  )
}
