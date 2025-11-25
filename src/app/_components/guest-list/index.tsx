'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import { useEventForm } from '~/app/_components/contexts/event-form-context'
import { useGuestForm } from '~/app/_components/contexts/guest-form-context'
import EventForm from '~/app/_components/forms/event-form'
import GuestForm from '~/app/_components/forms/guest-form'
import EventsTabs from '~/app/_components/guest-list/event-tabs'
import GuestsView from '~/app/_components/guest-list/guests-view'
import NoGuestsView from '~/app/_components/guest-list/no-guests-view'
import {
  type DashboardData,
  type EventFormData,
  type Household,
  type HouseholdFormData,
} from '~/app/utils/shared-types'

export default function GuestList({ dashboardData }: { dashboardData: DashboardData }) {
  const isEventFormOpen = useEventForm()
  const isGuestFormOpen = useGuestForm()
  const searchParams = useSearchParams()
  const selectedEventId = searchParams.get('event') ?? 'all'

  const [prefillEvent, setPrefillEvent] = useState<EventFormData | undefined>()
  const [prefillHousehold, setPrefillHousehold] = useState<HouseholdFormData | undefined>()

  const filteredHouseholdsByEvent = useMemo(
    () =>
      selectedEventId === 'all'
        ? (dashboardData?.households ?? [])
        : (dashboardData?.households?.map((household: Household) => {
            return {
              ...household,
              guests: household.guests.filter((guest) => {
                if (!guest.invitations) return false
                const matchingInvitation = guest.invitations.find(
                  (guest) => guest.eventId === selectedEventId
                )
                if (matchingInvitation === undefined) return false
                return matchingInvitation?.rsvp !== 'Not Invited'
              }),
            }
          }) ?? []),
    [selectedEventId, dashboardData?.households]
  )

  // Calculate total guests - simplified to avoid React Compiler memoization issues
  const totalGuests =
    filteredHouseholdsByEvent?.reduce(
      (acc: number, household: Household) => acc + household.guests.length,
      0
    ) ?? 0

  if (dashboardData === null) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="flex flex-col gap-5 text-center">
          <h1 className="text-3xl">Something went wrong!</h1>
          <p>Sorry about that. Please refresh the page in a moment.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {isGuestFormOpen && (
        <GuestForm events={dashboardData?.events} prefillFormData={prefillHousehold} />
      )}
      {isEventFormOpen && <EventForm prefillFormData={prefillEvent} />}
      <EventsTabs events={dashboardData?.events} selectedEventId={selectedEventId} />
      {totalGuests > 0 ? (
        <GuestsView
          events={dashboardData.events}
          households={filteredHouseholdsByEvent}
          selectedEventId={selectedEventId}
          setPrefillHousehold={setPrefillHousehold}
          setPrefillEvent={setPrefillEvent}
        />
      ) : (
        <NoGuestsView setPrefillHousehold={setPrefillHousehold} />
      )}
    </>
  )
}
