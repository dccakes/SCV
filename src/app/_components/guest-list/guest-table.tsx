'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { type Dispatch, type SetStateAction } from 'react'
import { AiOutlineHome } from 'react-icons/ai'
import { CiMail } from 'react-icons/ci'
import { FaSort } from 'react-icons/fa'
import { HiOutlinePhone } from 'react-icons/hi2'

import { useToggleGuestForm } from '~/app/_components/contexts/guest-form-context'
import { LoadingSpinner } from '~/app/_components/loaders'
import { sharedStyles } from '~/app/utils/shared-styles'
import {
  type Event,
  type FormInvites,
  type Guest,
  type Household,
  type HouseholdFormData,
} from '~/app/utils/shared-types'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { api } from '~/trpc/react'

type GuestTableProps = {
  events: Event[]
  households: Household[]
  selectedEventId: string
  setPrefillHousehold: Dispatch<SetStateAction<HouseholdFormData | undefined>>
}

export default function GuestTable({
  events,
  households,
  selectedEventId,
  setPrefillHousehold,
}: GuestTableProps) {
  const [nameSort, setNameSort] = useState('none')
  const [partySort, setPartySort] = useState('none')
  const [sortedHouseholds, setSortedHouseholds] = useState(households)
  const selectedEvent = events.find((event) => event.id === selectedEventId)
  const gridColumns =
    selectedEventId === 'all'
      ? `40px 240px 100px 125px repeat(${events.length}, 175px) 175px`
      : '40px 240px 100px 125px 175px 175px 150px 100px'

  useEffect(() => {
    setSortedHouseholds(households)
  }, [households])

  const sortByName = () => {
    setSortedHouseholds(() => {
      if (nameSort === 'none') {
        setNameSort('ascending')
        return [...households].sort((a, b) =>
          a.guests[0]!.firstName.localeCompare(b.guests[0]!.firstName)
        )
      } else if (nameSort === 'ascending') {
        setNameSort('descending')
        return [...households].sort((a, b) =>
          b.guests[0]!.firstName.localeCompare(a.guests[0]!.firstName)
        )
      } else {
        setNameSort('none')
        return households
      }
    })
  }

  const sortByParty = () => {
    setSortedHouseholds(() => {
      if (partySort === 'none') {
        setPartySort('ascending')
        return [...households].sort((a, b) => a.guests.length - b.guests.length)
      } else if (partySort === 'ascending') {
        setPartySort('descending')
        return [...households].sort((a, b) => b.guests.length - a.guests.length)
      } else {
        setPartySort('none')
        return households
      }
    })
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => sortByName()}>
          <FaSort className="mr-2 h-3 w-3" />
          Sort by Name
        </Button>
        <Button variant="outline" size="sm" onClick={() => sortByParty()}>
          <FaSort className="mr-2 h-3 w-3" />
          Sort by Party Size
        </Button>
      </div>

      <div className="max-h-[75vh] space-y-3 overflow-auto pr-2">
        {sortedHouseholds?.map((household) =>
          selectedEventId === 'all' ? (
            <DefaultCard
              key={household.id}
              household={household}
              events={events}
              setPrefillHousehold={setPrefillHousehold}
            />
          ) : (
            <SingleEventCard
              key={household.id}
              household={household}
              selectedEvent={selectedEvent}
              setPrefillHousehold={setPrefillHousehold}
            />
          )
        )}
      </div>
    </>
  )
}

type DefaultCardProps = {
  household: Household
  events: Event[]
  setPrefillHousehold: Dispatch<SetStateAction<HouseholdFormData | undefined>>
}

const DefaultCard = ({ household, events, setPrefillHousehold }: DefaultCardProps) => {
  const toggleGuestForm = useToggleGuestForm()
  if (household.guests.length < 1) return null

  const handleEditHousehold = () => {
    setPrefillHousehold({
      householdId: household.id,
      address1: household.address1 ?? undefined,
      address2: household.address2 ?? undefined,
      city: household.city ?? undefined,
      state: household.state ?? undefined,
      country: household.country ?? undefined,
      zipCode: household.zipCode ?? undefined,
      notes: household.notes ?? undefined,
      gifts: household.gifts,
      guestParty: household.guests.map((guest) => {
        const invitations: FormInvites = {}
        guest?.invitations?.forEach((inv) => {
          invitations[inv.eventId] = inv.rsvp!
        })
        return {
          guestId: guest.id,
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.email,
          phone: guest.phone,
          isPrimaryContact: guest.isPrimaryContact,
          ageGroup: guest.ageGroup ?? 'ADULT',
          tagIds: guest.guestTags?.map((gt) => gt.tagId) ?? [],
          invites: invitations,
        }
      }),
    })
    toggleGuestForm()
  }

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg"
      onClick={() => handleEditHousehold()}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-lg font-semibold">
                {household.guests[0]?.firstName} {household.guests[0]?.lastName}
                {household.guests.length > 1 && ` +${household.guests.length - 1}`}
              </h3>
              <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium">
                Party of {household.guests.length}
              </span>
            </div>

            <div className="mb-3 space-y-1 text-sm text-muted-foreground">
              {household.guests.map((guest) => (
                <div key={guest.id} className="flex items-center gap-2">
                  <span>
                    {guest.firstName} {guest.lastName}
                  </span>
                  {guest.isPrimaryContact && (
                    <span className="inline-flex items-center rounded-md bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <AiOutlineHome className="h-4 w-4" />
                <span className="text-xs">{household.address1 ? 'Address' : 'No address'}</span>
              </div>
              <div className="flex items-center gap-1">
                <HiOutlinePhone className="h-4 w-4" />
                <span className="text-xs">
                  {household.guests.some((g) => g.phone) ? 'Phone' : 'No phone'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <CiMail className="h-4 w-4" />
                <span className="text-xs">
                  {household.guests.some((g) => g.email) ? 'Email' : 'No email'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* RSVP Status for all events */}
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-muted/50 flex items-center justify-between rounded-md p-2"
          >
            <span className="text-sm font-medium">{event.name}</span>
            <div className="flex flex-wrap gap-2">
              {household.guests.map((guest) => {
                const rsvp = guest.invitations?.find((inv) => inv.eventId === event.id)?.rsvp
                return (
                  <InvitationDropdown
                    key={guest.id}
                    guest={guest}
                    event={event}
                    rsvp={rsvp ?? 'Not Invited'}
                  />
                )
              })}
            </div>
          </div>
        ))}

        {household.notes && (
          <div className="mt-2 rounded-md border border-yellow-200 bg-yellow-50 p-2 text-sm dark:border-yellow-900 dark:bg-yellow-950">
            <span className="font-medium">Notes:</span> {household.notes}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type SingleEventCardProps = {
  household: Household
  selectedEvent: Event | undefined
  setPrefillHousehold: Dispatch<SetStateAction<HouseholdFormData | undefined>>
}

const SingleEventCard = ({
  household,
  selectedEvent,
  setPrefillHousehold,
}: SingleEventCardProps) => {
  const router = useRouter()
  const toggleGuestForm = useToggleGuestForm()
  const updateGift = api.gift.update.useMutation({
    onSuccess: () => router.refresh(),
    onError: () => {
      window.alert('Failed to update gift! Please try again later.')
    },
  })

  if (selectedEvent === undefined || household.guests.length < 1) return null
  const selectedEventGift = household.gifts.find((gift) => gift.eventId === selectedEvent.id)

  const handleEditHousehold = () => {
    setPrefillHousehold({
      householdId: household.id,
      address1: household.address1 ?? undefined,
      address2: household.address2 ?? undefined,
      city: household.city ?? undefined,
      state: household.state ?? undefined,
      country: household.country ?? undefined,
      zipCode: household.zipCode ?? undefined,
      notes: household.notes ?? undefined,
      gifts: household.gifts.filter((gift) => gift.eventId === selectedEvent.id),
      guestParty: household.guests.map((guest) => {
        const invitations: FormInvites = {}
        guest?.invitations?.forEach((inv) => {
          invitations[inv.eventId] = inv.rsvp!
        })
        return {
          guestId: guest.id,
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.email,
          phone: guest.phone,
          isPrimaryContact: guest.isPrimaryContact,
          ageGroup: guest.ageGroup ?? 'ADULT',
          tagIds: guest.guestTags?.map((gt) => gt.tagId) ?? [],
          invites: invitations,
        }
      }),
    })
    toggleGuestForm()
  }

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg"
      onClick={() => handleEditHousehold()}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-lg font-semibold">
                {household.guests[0]?.firstName} {household.guests[0]?.lastName}
                {household.guests.length > 1 && ` +${household.guests.length - 1}`}
              </h3>
              <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium">
                Party of {household.guests.length}
              </span>
            </div>

            <div className="mb-3 space-y-1 text-sm text-muted-foreground">
              {household.guests.map((guest) => (
                <div key={guest.id} className="flex items-center gap-2">
                  <span>
                    {guest.firstName} {guest.lastName}
                  </span>
                  {guest.isPrimaryContact && (
                    <span className="inline-flex items-center rounded-md bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <AiOutlineHome className="h-4 w-4" />
                <span className="text-xs">{household.address1 ? 'Address' : 'No address'}</span>
              </div>
              <div className="flex items-center gap-1">
                <HiOutlinePhone className="h-4 w-4" />
                <span className="text-xs">
                  {household.guests.some((g) => g.phone) ? 'Phone' : 'No phone'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <CiMail className="h-4 w-4" />
                <span className="text-xs">
                  {household.guests.some((g) => g.email) ? 'Email' : 'No email'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* RSVP Status for selected event */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">{selectedEvent.name} RSVPs</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {household.guests.map((guest) => {
              const rsvp = guest.invitations?.find((inv) => inv.eventId === selectedEvent.id)?.rsvp
              return (
                <div
                  key={guest.id}
                  className="bg-muted/50 flex items-center gap-2 rounded-md p-1.5"
                >
                  <span className="text-xs text-muted-foreground">
                    {guest.firstName.charAt(0)}.{guest.lastName.charAt(0)}:
                  </span>
                  <InvitationDropdown
                    guest={guest}
                    event={selectedEvent}
                    rsvp={rsvp ?? 'Not Invited'}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Gift section */}
        {selectedEventGift && (
          <div className="rounded-md border border-purple-200 bg-purple-50 p-3 dark:border-purple-900 dark:bg-purple-950">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">Gift:</span>{' '}
                <span className="text-muted-foreground">
                  {selectedEventGift.description || 'Not specified'}
                </span>
              </div>
              {updateGift.isPending ? (
                <LoadingSpinner />
              ) : (
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    className="h-4 w-4 cursor-pointer"
                    style={{ accentColor: sharedStyles.primaryColorHex }}
                    type="checkbox"
                    onClick={(e) => e.stopPropagation()}
                    checked={selectedEventGift.thankyou}
                    onChange={(e) =>
                      updateGift.mutate({
                        householdId: household.id,
                        eventId: selectedEvent.id,
                        thankyou: e.target.checked,
                      })
                    }
                  />
                  <span>Thank you sent</span>
                </label>
              )}
            </div>
          </div>
        )}

        {household.notes && (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-2 text-sm dark:border-yellow-900 dark:bg-yellow-950">
            <span className="font-medium">Notes:</span> {household.notes}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type InvitationDropdownProps = {
  guest: Guest
  event: Event
  rsvp: string
}

const InvitationDropdown = ({ guest, event, rsvp }: InvitationDropdownProps) => {
  const router = useRouter()

  const updateInvitation = api.invitation.update.useMutation({
    onSuccess: () => router.refresh(),
    onError: () => {
      window.alert('Failed to update invitation! Please try again later.')
    },
  })

  return (
    <div key={guest.id} className="flex items-center">
      <span
        className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${sharedStyles.getRSVPcolor(rsvp)}`}
      ></span>
      {updateInvitation.isPending ? (
        <div className="m-auto w-[65%]">
          <LoadingSpinner />
        </div>
      ) : (
        <select
          name="guestRSVP"
          value={rsvp}
          id={`guest-rsvp-${guest.id}-${event.id}`}
          className="pr-3 font-light tracking-tight"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            updateInvitation.mutate({
              guestId: guest.id,
              eventId: event.id,
              rsvp: e.target.value,
            })
          }}
        >
          <option value="Not Invited">Not Invited</option>
          <option value="Invited">Invited</option>
          <option value="Attending">Attending</option>
          <option value="Declined">Declined</option>
        </select>
      )}
    </div>
  )
}
