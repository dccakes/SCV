'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { sharedStyles } from '~/app/utils/shared-styles'
import type { DashboardData, EventFormData } from '~/app/utils/shared-types'
import { useEventForm } from '~/components/contexts/event-form-context'
import { useGuestForm } from '~/components/contexts/guest-form-context'
import EventForm from '~/components/forms/event-form'
import GuestForm from '~/components/forms/guest-form'
import type { HouseholdFormData } from '~/components/forms/guest-form.schema'
import EventsTabs from '~/components/guest-list/event-tabs'
import GuestsView from '~/components/guest-list/guests-view'
import { InviteLinkPanel } from '~/components/guest-list/invite-link-panel'
import NoGuestsView from '~/components/guest-list/no-guests-view'

const CsvUploadDialog = dynamic(
  () =>
    import('~/components/guest-list/csv-upload-dialog').then((mod) => ({
      default: mod.CsvUploadDialog,
    })),
  { ssr: false }
)

export default function GuestList({ dashboardData }: { dashboardData: DashboardData }) {
  const isEventFormOpen = useEventForm()
  const isGuestFormOpen = useGuestForm()
  const searchParams = useSearchParams()
  const selectedEventId = searchParams.get('event') ?? 'all'

  const [prefillEvent, setPrefillEvent] = useState<EventFormData | undefined>()
  const [prefillHousehold, setPrefillHousehold] = useState<HouseholdFormData | undefined>()
  const [csvDialogOpen, setCsvDialogOpen] = useState(false)

  const filteredHouseholdsByEvent = useMemo(
    () =>
      selectedEventId === 'all'
        ? (dashboardData?.households ?? [])
        : (dashboardData?.households?.map((household) => {
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
      (acc: number, household) => acc + household.guests.length,
      0
    ) ?? 0

  if (dashboardData === null) {
    return (
      <div className='flex min-h-96 items-center justify-center'>
        <div className='flex flex-col gap-5 text-center'>
          <h1 className='text-3xl'>Something went wrong!</h1>
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
      {csvDialogOpen && (
        <CsvUploadDialog
          open={csvDialogOpen}
          onOpenChange={setCsvDialogOpen}
          events={dashboardData.events}
        />
      )}
      <EventsTabs events={dashboardData?.events} selectedEventId={selectedEventId} />
      <div className={`${sharedStyles.desktopPaddingSidesGuestList} mb-4 flex justify-end`}>
        <InviteLinkPanel />
      </div>
      {totalGuests > 0 ? (
        <GuestsView
          events={dashboardData.events}
          households={filteredHouseholdsByEvent}
          allHouseholds={dashboardData.households}
          selectedEventId={selectedEventId}
          setPrefillHousehold={setPrefillHousehold}
          setPrefillEvent={setPrefillEvent}
          onImportClick={() => setCsvDialogOpen(true)}
        />
      ) : (
        <NoGuestsView
          setPrefillHousehold={setPrefillHousehold}
          onImportClick={() => setCsvDialogOpen(true)}
        />
      )}
    </>
  )
}
