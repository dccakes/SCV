import { useEffect, useState } from 'react'
import { type Dispatch, type SetStateAction } from 'react'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import { IoIosArrowDown, IoMdCheckmark } from 'react-icons/io'

import { useOuterClick } from '~/app/_components/hooks'
import { sharedStyles } from '~/app/utils/shared-styles'
import { type Event, type Household } from '~/app/utils/shared-types'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'

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
    <div className="flex items-center gap-4">
      <div className="relative flex items-center">
        <Input
          id="search-guests-input"
          className="w-64 pr-12"
          placeholder="Find Guests"
          value={searchInput}
          onChange={(e) => filterHouseholdsBySearch(e.target.value)}
        />
        <div className="absolute right-0 flex h-full w-12 items-center justify-center rounded-r-md bg-primary">
          <FaMagnifyingGlass className="text-primary-foreground" size={18} />
        </div>
      </div>

      <div ref={invitationFilterRef}>
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShowInvitationDropdown((prev) => !prev)}
            className="w-48 justify-between"
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
                <span>{selectedRsvpFilter.rsvpValue}</span>
              </div>
            )}
            <IoIosArrowDown size={16} />
          </Button>
          {showInvitationDropdown && (
            <div className="absolute left-0 top-full z-10 mt-1 max-h-64 w-48 overflow-auto rounded-md border bg-popover p-3 shadow-md">
              {eventsToMap?.map(
                (event) =>
                  event && (
                    <div
                      key={event.id}
                      className="mb-4 flex flex-col border-b pb-2 last:mb-0 last:border-0"
                    >
                      <h5 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                        {event.name}
                      </h5>
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
        <Button
          variant="ghost"
          size="sm"
          className="text-primary"
          onClick={() => {
            setFilteredHouseholds(households)
            setSearchInput('')
            setSelectedRsvpFilter(null)
          }}
        >
          Clear
        </Button>
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
      className="flex cursor-pointer items-center justify-between rounded-sm p-2 text-sm transition-colors hover:bg-accent"
      onClick={(e) => handleChangeOption(e)}
    >
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${sharedStyles.getRSVPcolor(rsvpValue)}`} />
        <span>{rsvpValue}</span>
      </div>
      {isSelected && <IoMdCheckmark size={16} className="text-primary" />}
    </div>
  )
}
