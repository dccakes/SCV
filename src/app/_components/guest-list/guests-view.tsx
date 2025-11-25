import { useEffect, useMemo, useState } from 'react'
import { type Dispatch, type SetStateAction } from 'react'
import { BiPencil } from 'react-icons/bi'

import { useToggleEventForm } from '~/app/_components/contexts/event-form-context'
import { useToggleGuestForm } from '~/app/_components/contexts/guest-form-context'
import GuestSearchFilter from '~/app/_components/guest-list/guest-search-filter'
import GuestTable from '~/app/_components/guest-list/guest-table'
import { formatDateStandard } from '~/app/utils/helpers'
import { sharedStyles } from '~/app/utils/shared-styles'
import {
  type Event,
  type EventFormData,
  type Household,
  type HouseholdFormData,
} from '~/app/utils/shared-types'

type GuestsViewProps = {
  events: Event[]
  households: Household[]
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
        <div>
          <button className={sharedStyles.secondaryButton()}>Download List</button>
          <button
            className={`ml-5 ${sharedStyles.primaryButton()}`}
            onClick={() => {
              setPrefillHousehold(undefined)
              toggleGuestForm()
            }}
          >
            Add Guest
          </button>
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
  households: Household[]
  numEvents: number
  totalGuests: number
}

const DefaultTableHeader = ({ households, numEvents, totalGuests }: DefaultTableHeaderProps) => {
  return (
    <div>
      <div className="py-8">
        <span className="text-sm">
          TOTAL HOUSEHOLDS: <span className="font-bold">{households.length}</span>
        </span>
        <span className={sharedStyles.verticalDivider}>|</span>
        <span className="text-sm">
          TOTAL GUESTS: <span className="font-bold">{totalGuests}</span>
        </span>
        <span className={sharedStyles.verticalDivider}>|</span>
        <span className="text-sm">
          TOTAL EVENTS: <span className="font-bold">{numEvents}</span>
        </span>
      </div>
    </div>
  )
}

type SelectedEventTableHeaderProps = {
  totalGuests: number
  households: Household[]
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
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-xl font-bold">{selectedEvent.name}</h2>
        <BiPencil
          size={22}
          color={sharedStyles.primaryColorHex}
          className="cursor-pointer"
          onClick={() => handleEditEvent(selectedEvent)}
        />
      </div>
      <div className="flex gap-4">
        <span className="text-md font-semibold">{totalGuests} Guests Invited:</span>
        <div className="text-md flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full bg-green-400`} />
          <div className="font-medium">{guestResponses.attending}</div>
          Attending
        </div>
        <div className="text-md flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full bg-red-400`} />
          <span className="font-medium">{guestResponses.declined}</span>
          Declined
        </div>
        <div className="text-md flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full bg-gray-200`} />
          <span className="">{guestResponses.noResponse}</span>No Response
        </div>
      </div>
    </div>
  )
}
