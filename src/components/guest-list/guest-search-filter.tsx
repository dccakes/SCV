import { type Dispatch, type SetStateAction, useEffect, useState } from 'react'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import { IoIosArrowDown, IoMdCheckmark } from 'react-icons/io'

import { useOuterClick } from '~/components/hooks'
import { sharedStyles } from '~/app/utils/shared-styles'
import type { Event } from '~/app/utils/shared-types'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import type { HouseholdWithGuests } from '~/server/application/dashboard/dashboard.types'

type TSelectedRsvpFilter = {
  eventId: string
  rsvpValue: string
}

type GuestSearchFilterProps = {
  households: HouseholdWithGuests[]
  setFilteredHouseholds: Dispatch<SetStateAction<HouseholdWithGuests[]>>
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
  }, [])

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
    <div className='flex flex-wrap items-center gap-3'>
      <div className='relative flex items-center'>
        <Input
          id='search-guests-input'
          className='w-64 pr-12 font-sans text-sm'
          placeholder='Find guests'
          value={searchInput}
          onChange={(e) => filterHouseholdsBySearch(e.target.value)}
        />
        <div className='absolute right-0 flex h-full w-12 items-center justify-center rounded-r-md bg-primary'>
          <FaMagnifyingGlass className='text-primary-foreground' size={18} />
        </div>
      </div>

      <div ref={invitationFilterRef}>
        <div className='relative'>
          <Button
            variant='outline'
            onClick={() => setShowInvitationDropdown((prev) => !prev)}
            className='w-48 justify-between font-sans text-sm normal-case tracking-normal'
          >
            {selectedRsvpFilter === null ? (
              <span>Filter By</span>
            ) : (
              <div className='flex items-center gap-1.5'>
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
            <div className='absolute top-full left-0 z-10 mt-1 max-h-64 w-48 overflow-auto rounded-md border bg-popover p-3 shadow-md'>
              {eventsToMap?.map(
                (event) =>
                  event && (
                    <div
                      key={event.id}
                      className='mb-4 flex flex-col border-b pb-2 last:mb-0 last:border-0'
                    >
                      <h5 className='mb-2 font-medium text-muted-foreground text-xs uppercase'>
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
          variant='ghost'
          size='sm'
          className='font-sans text-sm normal-case tracking-normal text-primary'
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
  const handleChangeOption = () => {
    setSelectedRsvpFilter({ eventId, rsvpValue })
    filterHouseholdsByInvitation({ eventId, rsvpValue })
  }

  return (
    <button
      type='button'
      className='flex w-full cursor-pointer items-center justify-between rounded-sm p-2 text-sm transition-colors hover:bg-accent'
      onClick={handleChangeOption}
    >
      <div className='flex items-center gap-1.5'>
        <span className={`h-1.5 w-1.5 rounded-full ${sharedStyles.getRSVPcolor(rsvpValue)}`} />
        <span>{rsvpValue}</span>
      </div>
      {isSelected && <IoMdCheckmark size={16} className='text-primary' />}
    </button>
  )
}
