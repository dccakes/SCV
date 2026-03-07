import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { BiPencil } from 'react-icons/bi'

import { useToggleEventForm } from '~/app/_components/contexts/event-form-context'
import { useToggleGuestForm } from '~/app/_components/contexts/guest-form-context'
import type { HouseholdFormData } from '~/app/_components/forms/guest-form.schema'
import {
  type DrawerDraft,
  GuestDetailPanelContent,
  type RsvpSummary,
} from '~/app/_components/guest-list/guest-detail-panel-content'
import GuestSearchFilter from '~/app/_components/guest-list/guest-search-filter'
import { SelfInviteLinkManager } from '~/app/_components/guest-list/self-invite-link-manager'
import { GuestDetailDrawer } from '~/app/_components/guest-list/v2/drawer/guest-detail-drawer'
import { GuestCardsList } from '~/app/_components/guest-list/v2/list/guest-cards-list'
import { ListToolbar } from '~/app/_components/guest-list/v2/list/list-toolbar'
import { formatDateStandard } from '~/app/utils/helpers'
import type { Event, EventFormData, FormInvites } from '~/app/utils/shared-types'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import type { HouseholdWithGuests } from '~/server/application/dashboard/dashboard.types'

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
  const [nameSort, setNameSort] = useState<'none' | 'ascending' | 'descending'>('none')
  const [partySort, setPartySort] = useState<'none' | 'ascending' | 'descending'>('none')
  const [selectedHousehold, setSelectedHousehold] = useState<HouseholdWithGuests | undefined>()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isDrawerEditMode, setIsDrawerEditMode] = useState(false)
  const [showInviteLink, setShowInviteLink] = useState(false)
  const [drawerDraft, setDrawerDraft] = useState<DrawerDraft>({
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    notes: '',
  })

  const totalGuests =
    useMemo(
      () => filteredHouseholds?.reduce((acc, household) => acc + household.guests.length, 0),
      [filteredHouseholds]
    ) ?? 0

  useEffect(() => {
    setFilteredHouseholds(households)
  }, [households])

  useEffect(() => {
    if (!isDrawerOpen) return
    const selectedHouseholdId = selectedHousehold?.id
    if (!selectedHouseholdId) return
    const hasSelectedHousehold = filteredHouseholds.some(
      (household) => household.id === selectedHouseholdId
    )
    if (hasSelectedHousehold) return
    setIsDrawerOpen(false)
    setSelectedHousehold(undefined)
  }, [filteredHouseholds, isDrawerOpen, selectedHousehold])

  const sortByName = useCallback(() => {
    setNameSort((previous) => {
      if (previous === 'none') return 'ascending'
      if (previous === 'ascending') return 'descending'
      return 'none'
    })
    setPartySort('none')
  }, [])

  const sortByParty = useCallback(() => {
    setPartySort((previous) => {
      if (previous === 'none') return 'ascending'
      if (previous === 'ascending') return 'descending'
      return 'none'
    })
    setNameSort('none')
  }, [])

  const sortedHouseholds = useMemo(() => {
    if (nameSort !== 'none') {
      const direction = nameSort === 'ascending' ? 1 : -1
      return [...filteredHouseholds].sort((a, b) => {
        const first = (a.guests[0]?.firstName ?? '').localeCompare(b.guests[0]?.firstName ?? '')
        return first * direction
      })
    }

    if (partySort !== 'none') {
      const direction = partySort === 'ascending' ? 1 : -1
      return [...filteredHouseholds].sort((a, b) => (a.guests.length - b.guests.length) * direction)
    }

    return filteredHouseholds
  }, [filteredHouseholds, nameSort, partySort])

  const getHouseholdFormData = (household: HouseholdWithGuests): HouseholdFormData => {
    return {
      householdId: household.id,
      address1: household.address1 ?? undefined,
      address2: household.address2 ?? undefined,
      city: household.city ?? undefined,
      state: household.state ?? undefined,
      country: household.country ?? undefined,
      zipCode: household.zipCode ?? undefined,
      notes: household.notes ?? undefined,
      gifts:
        selectedEventId === 'all'
          ? household.gifts
          : household.gifts.filter((gift) => gift.eventId === selectedEventId),
      deletedGuests: [],
      guestParty: household.guests.map((guest) => {
        const invitations: FormInvites = {}
        guest.invitations.forEach((invitation) => {
          invitations[invitation.eventId] = invitation.rsvp ?? 'Not Invited'
        })

        return {
          guestId: guest.id,
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.email,
          phone: guest.phone,
          isPrimaryContact: guest.isPrimaryContact,
          ageGroup: guest.ageGroup ?? 'ADULT',
          tagIds: guest.guestTags?.map((guestTag) => guestTag.tagId) ?? [],
          invites: invitations,
        }
      }),
    }
  }

  const handleEditHousehold = () => {
    if (selectedHousehold === undefined) return

    setPrefillHousehold(getHouseholdFormData(selectedHousehold))
    setIsDrawerOpen(false)
    toggleGuestForm()
  }

  const handleContinueWithDraft = () => {
    if (!selectedHousehold) return

    const prefill = getHouseholdFormData(selectedHousehold)
    const primaryIndex = prefill.guestParty.findIndex((guest) => guest.isPrimaryContact)

    if (primaryIndex >= 0) {
      const primaryGuest = prefill.guestParty[primaryIndex]
      if (!primaryGuest) return

      prefill.guestParty[primaryIndex] = {
        ...primaryGuest,
        email: drawerDraft.email || null,
        phone: drawerDraft.phone || null,
      }
    }

    setPrefillHousehold({
      ...prefill,
      address1: drawerDraft.address1 || undefined,
      address2: drawerDraft.address2 || undefined,
      city: drawerDraft.city || undefined,
      state: drawerDraft.state || undefined,
      zipCode: drawerDraft.zipCode || undefined,
      country: drawerDraft.country || undefined,
      notes: drawerDraft.notes || undefined,
    })

    setIsDrawerOpen(false)
    setIsDrawerEditMode(false)
    toggleGuestForm()
  }

  const eventNameById = useMemo(() => {
    return new Map(events.map((event) => [event.id, event.name]))
  }, [events])

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId),
    [events, selectedEventId]
  )

  const selectedEventResponses = useMemo(() => {
    return selectedHousehold?.guests.map((guest) => {
      const invitation = guest.invitations.find((inv) => inv.eventId === selectedEventId)
      return {
        id: guest.id,
        name: `${guest.firstName} ${guest.lastName}`,
        rsvp: invitation?.rsvp ?? 'Not Invited',
      }
    })
  }, [selectedEventId, selectedHousehold])
  const selectedHouseholdTags = useMemo(() => {
    if (!selectedHousehold) return []

    return Array.from(
      new Set(
        selectedHousehold.guests
          .flatMap((guest) => guest.guestTags ?? [])
          .map((guestTag) => guestTag.tagId)
          .filter(Boolean)
      )
    ).slice(0, 4)
  }, [selectedHousehold])

  useEffect(() => {
    if (!selectedHousehold) return

    const primary = selectedHousehold.guests.find((guest) => guest.isPrimaryContact)
    setDrawerDraft({
      email: primary?.email ?? '',
      phone: primary?.phone ?? '',
      address1: selectedHousehold.address1 ?? '',
      address2: selectedHousehold.address2 ?? '',
      city: selectedHousehold.city ?? '',
      state: selectedHousehold.state ?? '',
      zipCode: selectedHousehold.zipCode ?? '',
      country: selectedHousehold.country ?? '',
      notes: selectedHousehold.notes ?? '',
    })
  }, [selectedHousehold])

  const communicationLog = useMemo(() => {
    if (!selectedHousehold) return []

    type CommunicationItem = {
      type: 'sent'
      text: string
      date: Date
    }

    const timestamps = selectedHousehold.guests.flatMap((guest) =>
      guest.invitations
        .map((invitation) => {
          if (!invitation.invitedAt) return null
          return {
            type: 'sent' as const,
            text: `Invitation sent for ${eventNameById.get(invitation.eventId) ?? 'event'}`,
            date: invitation.invitedAt,
          }
        })
        .filter((item): item is CommunicationItem => item !== null)
    )

    return timestamps.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 4)
  }, [eventNameById, selectedHousehold])

  const allEventRsvpSummary = useMemo(() => {
    if (!selectedHousehold || selectedEventId !== 'all') return new Map<string, RsvpSummary>()

    const summaryByEventId = new Map<string, RsvpSummary>()

    selectedHousehold.guests.forEach((guest) => {
      guest.invitations.forEach((invitation) => {
        const current = summaryByEventId.get(invitation.eventId) ?? {
          attending: 0,
          invited: 0,
          declined: 0,
        }

        if (invitation.rsvp === 'Attending') current.attending += 1
        else if (invitation.rsvp === 'Invited') current.invited += 1
        else if (invitation.rsvp === 'Declined') current.declined += 1

        summaryByEventId.set(invitation.eventId, current)
      })
    })

    return summaryByEventId
  }, [selectedEventId, selectedHousehold])

  const handleSelectHousehold = useCallback((household: HouseholdWithGuests) => {
    setSelectedHousehold(household)
    setIsDrawerEditMode(false)
    setIsDrawerOpen(true)
  }, [])

  const handleDrawerOpenChange = useCallback((open: boolean) => {
    setIsDrawerOpen(open)
    if (open) return
    setSelectedHousehold(undefined)
    setIsDrawerEditMode(false)
  }, [])

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
          selectedEvent={selectedEvent}
          setPrefillEvent={setPrefillEvent}
        />
      )}
      <div className='mb-4 flex justify-between'>
        <GuestSearchFilter
          setFilteredHouseholds={setFilteredHouseholds}
          households={households}
          events={events}
          selectedEventId={selectedEventId}
        />
        <div className='flex gap-3'>
          <Button variant='outline'>Download List</Button>
          <Button
            variant='outline'
            onClick={() => setShowInviteLink((v) => !v)}
            aria-expanded={showInviteLink}
          >
            Invite Link
          </Button>
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
      {showInviteLink && (
        <div className='mb-6 rounded-lg border border-border bg-muted/20 p-4'>
          <p className='mb-3 font-mono text-[0.58rem] text-foreground/60 uppercase tracking-widest'>
            Guest Self-Invite Link
          </p>
          <p className='mb-3 text-muted-foreground text-sm'>
            Share this link so guests can add their own contact details to your list.
          </p>
          <SelfInviteLinkManager />
        </div>
      )}
      <div className='space-y-4'>
        <ListToolbar
          totalHouseholds={sortedHouseholds.length}
          onSortByName={sortByName}
          onSortByPartySize={sortByParty}
        />
        <GuestCardsList
          households={sortedHouseholds}
          selectedHouseholdId={selectedHousehold?.id}
          onSelectHousehold={handleSelectHousehold}
        />
      </div>

      <GuestDetailDrawer
        open={isDrawerOpen && selectedHousehold !== undefined}
        onOpenChange={handleDrawerOpenChange}
        title={
          selectedHousehold?.guests[0]
            ? `${selectedHousehold.guests[0].firstName} ${selectedHousehold.guests[0].lastName}`
            : 'Guest details'
        }
        subtitle={selectedEventId === 'all' ? 'Across all events' : selectedEvent?.name}
        headerMeta={
          <div className='flex flex-wrap gap-1.5'>
            {selectedHouseholdTags.map((tag) => (
              <Badge
                key={tag}
                variant='outline'
                className='border-foreground/15 bg-foreground/[0.04] text-[0.58rem] text-foreground/70 uppercase tracking-wider'
              >
                {tag}
              </Badge>
            ))}
          </div>
        }
        footer={
          <div className='flex gap-2'>
            {isDrawerEditMode ? (
              <>
                <Button
                  type='button'
                  variant='outline'
                  className='flex-1'
                  onClick={() => setIsDrawerEditMode(false)}
                >
                  Cancel
                </Button>
                <Button type='button' className='flex-1' onClick={handleContinueWithDraft}>
                  Continue in Form
                </Button>
              </>
            ) : (
              <>
                <Button
                  type='button'
                  variant='outline'
                  className='flex-1'
                  onClick={() => setIsDrawerEditMode(true)}
                >
                  Edit Details
                </Button>
                <Button type='button' className='flex-1' onClick={handleEditHousehold}>
                  Open Full Editor
                </Button>
              </>
            )}
          </div>
        }
      >
        {selectedHousehold ? (
          <GuestDetailPanelContent
            selectedHousehold={selectedHousehold}
            selectedEventId={selectedEventId}
            events={events}
            selectedEventResponses={selectedEventResponses}
            communicationLog={communicationLog}
            allEventRsvpSummary={allEventRsvpSummary}
            isDrawerEditMode={isDrawerEditMode}
            setIsDrawerEditMode={setIsDrawerEditMode}
            drawerDraft={drawerDraft}
            setDrawerDraft={setDrawerDraft}
          />
        ) : null}
      </GuestDetailDrawer>
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
    <div className='py-8'>
      <div className='flex flex-wrap items-center gap-4 md:gap-6'>
        <div>
          <span className='font-mono text-[0.58rem] text-foreground/55 uppercase tracking-widest'>
            Total Households:{' '}
          </span>
          <span className='font-semibold text-foreground text-sm md:text-base'>
            {households.length}
          </span>
        </div>
        <div className='hidden h-4 w-px bg-border md:block' />
        <div>
          <span className='font-mono text-[0.58rem] text-foreground/55 uppercase tracking-widest'>
            Total Guests:{' '}
          </span>
          <span className='font-semibold text-foreground text-sm md:text-base'>{totalGuests}</span>
        </div>
        <div className='hidden h-4 w-px bg-border md:block' />
        <div>
          <span className='font-mono text-[0.58rem] text-foreground/55 uppercase tracking-widest'>
            Total Events:{' '}
          </span>
          <span className='font-semibold text-foreground text-sm md:text-base'>{numEvents}</span>
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
    <div className='py-8'>
      <div className='mb-4 flex items-center gap-2'>
        <h2 className='font-bold text-xl'>{selectedEvent.name}</h2>
        <button
          type='button'
          aria-label='Edit event details'
          className='rounded-sm text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2'
          onClick={() => handleEditEvent(selectedEvent)}
        >
          <BiPencil size={22} aria-hidden='true' />
        </button>
      </div>
      <div className='flex flex-wrap items-center gap-4 md:gap-6'>
        <span className='font-semibold text-foreground'>{totalGuests} Guests Invited:</span>
        <div className='flex items-center gap-1.5'>
          <span className='h-1.5 w-1.5 rounded-full bg-success' />
          <span className='font-medium'>{guestResponses.attending}</span>
          <span className='font-mono text-[0.58rem] text-foreground/60 uppercase tracking-wider'>
            Attending
          </span>
        </div>
        <div className='flex items-center gap-1.5'>
          <span className='h-1.5 w-1.5 rounded-full bg-destructive' />
          <span className='font-medium'>{guestResponses.declined}</span>
          <span className='font-mono text-[0.58rem] text-foreground/60 uppercase tracking-wider'>
            Declined
          </span>
        </div>
        <div className='flex items-center gap-1.5'>
          <span className='h-1.5 w-1.5 rounded-full bg-muted-foreground' />
          <span className='font-medium'>{guestResponses.noResponse}</span>
          <span className='font-mono text-[0.58rem] text-foreground/60 uppercase tracking-wider'>
            No Response
          </span>
        </div>
      </div>
    </div>
  )
}
