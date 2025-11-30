import { useEffect, useMemo, useState } from 'react'
import { type Dispatch, type SetStateAction } from 'react'
import { BiPencil } from 'react-icons/bi'

import { useToggleEventForm } from '~/app/_components/contexts/event-form-context'
import { useToggleGuestForm } from '~/app/_components/contexts/guest-form-context'
import { type HouseholdFormData } from '~/app/_components/forms/guest-form.schema'
import GuestSearchFilter from '~/app/_components/guest-list/guest-search-filter'
import GuestTable from '~/app/_components/guest-list/guest-table'
import { formatDateStandard } from '~/app/utils/helpers'
import { type Event, type EventFormData } from '~/app/utils/shared-types'
import { Button } from '~/components/ui/button'
import { type HouseholdWithGuests } from '~/server/application/dashboard/dashboard.types'

type GuestsViewProps = {
  events: Event[]
  households: HouseholdWithGuests[]
  selectedEventId: string
  setPrefillHousehold: Dispatch<SetStateAction<HouseholdFormData | undefined>>
  setPrefillEvent: Dispatch<SetStateAction<EventFormData | undefined>>
}

export default function GuestsView({
  events,
  households,
  selectedEventId,
  setPrefillHousehold,
  setPrefillEvent,
}: GuestsViewProps) {
  const toggleGuestForm = useToggleGuestForm()
  const [filteredHouseholds, setFilteredHouseholds] = useState(households)

  const totalGuests =
    useMemo(
      () => filteredHouseholds?.reduce((acc, household) => acc + household.guests.length, 0),
      [filteredHouseholds]
    ) ?? 0

  useEffect(() => {
    setFilteredHouseholds(households)
  }, [households])

  return (
    <section>
      {selectedEventId === 'all' ? (
        <DefaultTableHeader
          households={filteredHouseholds}
          totalGuests={totalGuests}
          numEvents={events.length}
        />
      ) : (
        <SelectedEventTableHeader
          totalGuests={totalGuests}
          households={filteredHouseholds}
          selectedEvent={events.find((event) => event.id === selectedEventId)}
          setPrefillEvent={setPrefillEvent}
        />
      )}
      <div className="mb-8 flex justify-between">
        <GuestSearchFilter
          setFilteredHouseholds={setFilteredHouseholds}
          households={households}
          events={events}
          selectedEventId={selectedEventId}
        />
        <div className="flex gap-3">
          <Button variant="outline">Download List</Button>
          <Button
            onClick={() => {
              setPrefillHousehold(undefined)
              toggleGuestForm()
            }}
          >
            Add Guest
          </Button>
        </div>
      </div>
      <GuestTable
        events={events}
        households={filteredHouseholds}
        selectedEventId={selectedEventId}
        setPrefillHousehold={setPrefillHousehold}
      />
    </section>
  )
}

type DefaultTableHeaderProps = {
  households: HouseholdWithGuests[]
  numEvents: number
  totalGuests: number
}

const DefaultTableHeader = ({ households, numEvents, totalGuests }: DefaultTableHeaderProps) => {
  return (
    <div className="py-8">
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div>
          <span className="uppercase">Total Households: </span>
          <span className="font-bold text-foreground">{households.length}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div>
          <span className="uppercase">Total Guests: </span>
          <span className="font-bold text-foreground">{totalGuests}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div>
          <span className="uppercase">Total Events: </span>
          <span className="font-bold text-foreground">{numEvents}</span>
        </div>
      </div>
    </div>
  )
}

type SelectedEventTableHeaderProps = {
  totalGuests: number
  households: HouseholdWithGuests[]
  selectedEvent: Event | undefined
  setPrefillEvent: Dispatch<SetStateAction<EventFormData | undefined>>
}

const SelectedEventTableHeader = ({
  totalGuests,
  households,
  selectedEvent,
  setPrefillEvent,
}: SelectedEventTableHeaderProps) => {
  const toggleEventForm = useToggleEventForm()
  const guestResponses = useMemo(() => {
    const guestResponses = {
      attending: 0,
      declined: 0,
      noResponse: 0,
    }

    households.forEach((household) => {
      household.guests.forEach((guest) => {
        if (!guest.invitations) return
        const matchingInvitation = guest.invitations.find(
          (inv) => inv.eventId === selectedEvent?.id
        )
        if (!matchingInvitation) return
        switch (matchingInvitation.rsvp) {
          case 'Attending':
            guestResponses.attending += 1
            break
          case 'Declined':
            guestResponses.declined += 1
            break
          default:
            guestResponses.noResponse += 1
            break
        }
      })
    })

    return guestResponses
  }, [households, selectedEvent])

  if (selectedEvent === undefined) return null

  const handleEditEvent = (event: Event) => {
    const standardDate = formatDateStandard(event.date)

    setPrefillEvent({
      eventName: event.name,
      date: standardDate ?? undefined,
      startTime: event.startTime ?? undefined,
      endTime: event.endTime ?? undefined,
      venue: event.venue ?? undefined,
      attire: event.attire ?? undefined,
      description: event.description ?? undefined,
      eventId: event.id,
    })
    toggleEventForm()
  }

  return (
    <div className="py-8">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-xl font-bold">{selectedEvent.name}</h2>
        <BiPencil
          size={22}
          className="hover:text-primary/80 cursor-pointer text-primary transition-colors"
          onClick={() => handleEditEvent(selectedEvent)}
        />
      </div>
      <div className="flex items-center gap-6 text-sm">
        <span className="font-semibold text-foreground">{totalGuests} Guests Invited:</span>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 dark:bg-green-400" />
          <span className="font-medium">{guestResponses.attending}</span>
          <span className="text-muted-foreground">Attending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 dark:bg-red-400" />
          <span className="font-medium">{guestResponses.declined}</span>
          <span className="text-muted-foreground">Declined</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
          <span className="font-medium">{guestResponses.noResponse}</span>
          <span className="text-muted-foreground">No Response</span>
        </div>
      </div>
    </div>
  )
}
