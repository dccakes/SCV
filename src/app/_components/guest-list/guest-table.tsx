'use client'

import { ArrowUpDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react'
import { AiOutlineHome } from 'react-icons/ai'
import { CiMail } from 'react-icons/ci'
import { HiOutlinePhone } from 'react-icons/hi2'
import { toast } from 'sonner'

import { useToggleGuestForm } from '~/app/_components/contexts/guest-form-context'
import type { HouseholdFormData } from '~/app/_components/forms/guest-form.schema'
import { LoadingSpinner } from '~/app/_components/loaders'
import { sharedStyles } from '~/app/utils/shared-styles'
import type { Event, FormInvites, Guest } from '~/app/utils/shared-types'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import type { HouseholdWithGuests } from '~/server/application/dashboard/dashboard.types'
import { api } from '~/trpc/react'

type GuestTableProps = {
  events: Event[]
  households: HouseholdWithGuests[]
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
  const _gridColumns =
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
          (a.guests[0]?.firstName ?? '').localeCompare(b.guests[0]?.firstName ?? '')
        )
      } else if (nameSort === 'ascending') {
        setNameSort('descending')
        return [...households].sort((a, b) =>
          (b.guests[0]?.firstName ?? '').localeCompare(a.guests[0]?.firstName ?? '')
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
      <div className='mb-4 flex items-center gap-2'>
        <Button variant='outline' size='sm' onClick={() => sortByName()}>
          <ArrowUpDown className='mr-2 h-3 w-3' />
          Sort by Name
        </Button>
        <Button variant='outline' size='sm' onClick={() => sortByParty()}>
          <ArrowUpDown className='mr-2 h-3 w-3' />
          Sort by Party Size
        </Button>
      </div>

      <div className='max-h-[75vh] space-y-3 overflow-auto pr-2'>
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
  household: HouseholdWithGuests
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
      deletedGuests: [],
      guestParty: household.guests.map((guest) => {
        const invitations: FormInvites = {}
        guest?.invitations?.forEach((inv) => {
          invitations[inv.eventId] = inv.rsvp ?? 'Not Invited'
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
      className='cursor-pointer transition-all hover:shadow-lg'
      onClick={() => handleEditHousehold()}
    >
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <div className='mb-2 flex items-center gap-2'>
              <h3 className='font-semibold text-lg'>
                {household.guests[0]?.firstName} {household.guests[0]?.lastName}
                {household.guests.length > 1 && ` +${household.guests.length - 1}`}
              </h3>
              <span className='inline-flex items-center rounded-full bg-secondary px-2 py-1 font-medium text-xs'>
                Party of {household.guests.length}
              </span>
            </div>

            <div className='mb-3 space-y-1 text-muted-foreground text-sm'>
              {household.guests.map((guest) => (
                <div key={guest.id} className='flex items-center gap-2'>
                  <span>
                    {guest.firstName} {guest.lastName}
                  </span>
                  {guest.isPrimaryContact && (
                    <span className='inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 font-medium text-primary text-xs'>
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className='flex items-center gap-3 text-muted-foreground text-sm'>
              <div className='flex items-center gap-1'>
                <AiOutlineHome className='h-4 w-4' />
                <span className='text-xs'>{household.address1 ? 'Address' : 'No address'}</span>
              </div>
              <div className='flex items-center gap-1'>
                <HiOutlinePhone className='h-4 w-4' />
                <span className='text-xs'>
                  {household.guests.some((g) => g.phone) ? 'Phone' : 'No phone'}
                </span>
              </div>
              <div className='flex items-center gap-1'>
                <CiMail className='h-4 w-4' />
                <span className='text-xs'>
                  {household.guests.some((g) => g.email) ? 'Email' : 'No email'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-2'>
        {/* RSVP Status for all events */}
        {events.map((event) => (
          <div
            key={event.id}
            className='flex items-center justify-between rounded-md bg-muted/50 p-2'
          >
            <span className='font-medium text-sm'>{event.name}</span>
            <div className='flex flex-wrap gap-2'>
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
          <div className='mt-2 rounded-md border border-border bg-muted/40 p-2 text-sm'>
            <span className='font-medium'>Notes:</span> {household.notes}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type SingleEventCardProps = {
  household: HouseholdWithGuests
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
      toast.error('Failed to update gift. Please try again.')
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
      deletedGuests: [],
      guestParty: household.guests.map((guest) => {
        const invitations: FormInvites = {}
        guest?.invitations?.forEach((inv) => {
          invitations[inv.eventId] = inv.rsvp ?? 'Not Invited'
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
      className='cursor-pointer transition-all hover:shadow-lg'
      onClick={() => handleEditHousehold()}
    >
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <div className='mb-2 flex items-center gap-2'>
              <h3 className='font-semibold text-lg'>
                {household.guests[0]?.firstName} {household.guests[0]?.lastName}
                {household.guests.length > 1 && ` +${household.guests.length - 1}`}
              </h3>
              <span className='inline-flex items-center rounded-full bg-secondary px-2 py-1 font-medium text-xs'>
                Party of {household.guests.length}
              </span>
            </div>

            <div className='mb-3 space-y-1 text-muted-foreground text-sm'>
              {household.guests.map((guest) => (
                <div key={guest.id} className='flex items-center gap-2'>
                  <span>
                    {guest.firstName} {guest.lastName}
                  </span>
                  {guest.isPrimaryContact && (
                    <span className='inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 font-medium text-primary text-xs'>
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className='flex items-center gap-3 text-muted-foreground text-sm'>
              <div className='flex items-center gap-1'>
                <AiOutlineHome className='h-4 w-4' />
                <span className='text-xs'>{household.address1 ? 'Address' : 'No address'}</span>
              </div>
              <div className='flex items-center gap-1'>
                <HiOutlinePhone className='h-4 w-4' />
                <span className='text-xs'>
                  {household.guests.some((g) => g.phone) ? 'Phone' : 'No phone'}
                </span>
              </div>
              <div className='flex items-center gap-1'>
                <CiMail className='h-4 w-4' />
                <span className='text-xs'>
                  {household.guests.some((g) => g.email) ? 'Email' : 'No email'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-3'>
        {/* RSVP Status for selected event */}
        <div>
          <div className='mb-2 flex items-center justify-between'>
            <span className='font-medium text-sm'>{selectedEvent.name} RSVPs</span>
          </div>
          <div className='flex flex-wrap gap-2'>
            {household.guests.map((guest) => {
              const rsvp = guest.invitations?.find((inv) => inv.eventId === selectedEvent.id)?.rsvp
              return (
                <div
                  key={guest.id}
                  className='flex items-center gap-2 rounded-md bg-muted/50 p-1.5'
                >
                  <span className='text-muted-foreground text-xs'>
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
          <div className='rounded-md border border-border bg-accent/10 p-3'>
            <div className='flex items-center justify-between'>
              <div className='text-sm'>
                <span className='font-medium'>Gift:</span>{' '}
                <span className='text-muted-foreground'>
                  {selectedEventGift.description || 'Not specified'}
                </span>
              </div>
              {updateGift.isPending ? (
                <LoadingSpinner />
              ) : (
                <label className='flex cursor-pointer items-center gap-2 text-sm'>
                  <input
                    className='h-4 w-4 cursor-pointer'
                    style={{ accentColor: sharedStyles.primaryColorHex }}
                    type='checkbox'
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
          <div className='rounded-md border border-border bg-muted/40 p-2 text-sm'>
            <span className='font-medium'>Notes:</span> {household.notes}
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
      toast.error('Failed to update invitation. Please try again.')
    },
  })

  return (
    <div key={guest.id} className='flex items-center'>
      <span
        className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${sharedStyles.getRSVPcolor(rsvp)}`}
      ></span>
      {updateInvitation.isPending ? (
        <div className='m-auto w-[65%]'>
          <LoadingSpinner />
        </div>
      ) : (
        <Select
          value={rsvp}
          onValueChange={(value) => {
            updateInvitation.mutate({
              guestId: guest.id,
              eventId: event.id,
              rsvp: value,
            })
          }}
        >
          <SelectTrigger className='h-7 w-36 text-xs' onClick={(e) => e.stopPropagation()}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent onClick={(e) => e.stopPropagation()}>
            <SelectItem value='Not Invited'>Not Invited</SelectItem>
            <SelectItem value='Invited'>Invited</SelectItem>
            <SelectItem value='Attending'>Attending</SelectItem>
            <SelectItem value='Declined'>Declined</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
