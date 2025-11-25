import { useEffect, useState } from 'react'
import { type Dispatch, type SetStateAction } from 'react'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import { IoIosArrowDown, IoMdCheckmark } from 'react-icons/io'

import { useOuterClick } from '~/app/_components/hooks'
import { sharedStyles } from '~/app/utils/shared-styles'
import { type Event, type Household } from '~/app/utils/shared-types'

type TSelectedRsvpFilter = {
  eventId: string
  rsvpValue: string
}

type GuestSearchFilterProps = {
  households: Household[]
  setFilteredHouseholds: Dispatch<SetStateAction<Household[]>>
  events: Event[]
  selectedEventId: string
}

export default function GuestSearchFilter({
  households,
  setFilteredHouseholds,
  events,
  selectedEventId,
}: GuestSearchFilterProps) {
  const [searchInput, setSearchInput] = useState('')
  const [showInvitationDropdown, setShowInvitationDropdown] = useState(false)
  const [selectedRsvpFilter, setSelectedRsvpFilter] = useState<TSelectedRsvpFilter | null>(null)
  const invitationFilterRef = useOuterClick(() => setShowInvitationDropdown(false))

  useEffect(() => {
    // Reset filters when event changes - intentionally setting state in effect for state synchronization
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedRsvpFilter(null)

    setSearchInput('')
  }, [selectedEventId])

  const eventsToMap =
    selectedEventId === 'all' ? events : [events.find((event) => event.id === selectedEventId)]

  const filterHouseholds = (searchText: string, rsvpFilter: TSelectedRsvpFilter | null) => {
    setFilteredHouseholds(() =>
      households.filter((household) =>
        household.guests.some((guest) =>
          rsvpFilter
            ? (guest.firstName.includes(searchText) || guest.lastName.includes(searchText)) &&
              guest.invitations?.some(
                (inv) => inv.eventId === rsvpFilter?.eventId && inv.rsvp === rsvpFilter?.rsvpValue
              )
            : guest.firstName.includes(searchText) || guest.lastName.includes(searchText)
        )
      )
    )
  }

  const filterHouseholdsBySearch = (searchText: string) => {
    setSearchInput(searchText)
    filterHouseholds(searchText, selectedRsvpFilter)
  }

  const filterHouseholdsByInvitation = ({ eventId, rsvpValue }: TSelectedRsvpFilter) => {
    setShowInvitationDropdown(false)
    setSelectedRsvpFilter({ eventId, rsvpValue })
    filterHouseholds(searchInput, { eventId, rsvpValue })
  }

  return (
    <div className="flex items-center">
      <div className="flex">
        <input
          id="search-guests-input"
          className="h-12 w-64 border-2 px-3 py-2"
          placeholder="Find Guests"
          value={searchInput}
          onChange={(e) => filterHouseholdsBySearch(e.target.value)}
        ></input>
        <div
          className={`flex h-12 w-16 items-center justify-center bg-${sharedStyles.primaryColor}`}
        >
          <FaMagnifyingGlass className="text-white" size={20} />
        </div>
      </div>

      <div className="pl-7" ref={invitationFilterRef}>
        <div className="relative h-12 w-48 border">
          <div
            onClick={() => setShowInvitationDropdown((prev) => !prev)}
            className="flex cursor-pointer items-center justify-between p-3"
          >
            {selectedRsvpFilter === null ? (
              <span>Filter By</span>
            ) : (
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${sharedStyles.getRSVPcolor(
                    selectedRsvpFilter.rsvpValue
                  )}`}
                />
                <p>{selectedRsvpFilter.rsvpValue}</p>
              </div>
            )}
            <IoIosArrowDown size={20} />
          </div>
          {showInvitationDropdown && (
            <div className="absolute left-0 top-11 z-10 h-52 w-48 overflow-auto border bg-white p-3">
              {eventsToMap?.map(
                (event) =>
                  event && (
                    <div key={event.id} className="mb-4 flex flex-col border-b pb-2 font-light">
                      <h5 className="mb-2 text-xs font-medium">{event.name.toUpperCase()}</h5>
                      {['Not Invited', 'Invited', 'Attending', 'Declined'].map((rsvp) => (
                        <InvitationOption
                          key={rsvp}
                          rsvpValue={rsvp}
                          eventId={event.id}
                          filterHouseholdsByInvitation={filterHouseholdsByInvitation}
                          setSelectedRsvpFilter={setSelectedRsvpFilter}
                          isSelected={
                            event.id === selectedRsvpFilter?.eventId &&
                            rsvp === selectedRsvpFilter?.rsvpValue
                          }
                        />
                      ))}
                    </div>
                  )
              )}
            </div>
          )}
        </div>
      </div>
      {!!selectedRsvpFilter && (
        <span
          className={`ml-3 cursor-pointer text-${sharedStyles.primaryColor}`}
          onClick={() => {
            setFilteredHouseholds(households)
            setSearchInput('')
            setSelectedRsvpFilter(null)
          }}
        >
          Clear
        </span>
      )}
    </div>
  )
}

type InvitationOptionProps = {
  rsvpValue: string
  eventId: string
  setSelectedRsvpFilter: Dispatch<SetStateAction<TSelectedRsvpFilter | null>>
  filterHouseholdsByInvitation: (filter: TSelectedRsvpFilter) => void
  isSelected: boolean
}

const InvitationOption = ({
  rsvpValue,
  eventId,
  setSelectedRsvpFilter,
  filterHouseholdsByInvitation,
  isSelected,
}: InvitationOptionProps) => {
  const handleChangeOption = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    setSelectedRsvpFilter({ eventId, rsvpValue: target.innerText })
    filterHouseholdsByInvitation({ eventId, rsvpValue: target.innerText })
  }

  return (
    <div
      className="text-md flex cursor-pointer items-center justify-between p-1 pl-3 hover:bg-gray-100"
      onClick={(e) => handleChangeOption(e)}
    >
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${sharedStyles.getRSVPcolor(rsvpValue)}`} />
        <p>{rsvpValue}</p>
      </div>
      {isSelected && <IoMdCheckmark size={20} />}
    </div>
  )
}
