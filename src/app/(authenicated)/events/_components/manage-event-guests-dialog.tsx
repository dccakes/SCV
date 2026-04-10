'use client'

import { Loader2, Search } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import type { EventWithStats } from '~/server/domains/event/event.types'
import { api } from '~/trpc/react'

type ManageEventGuestsDialogProps = Readonly<{
  event: EventWithStats
  open: boolean
  onOpenChange: (open: boolean) => void
}>

type GuestInviteState = {
  guestId: number
  eventId: string
  firstName: string
  lastName: string
  currentRsvp: string
  newRsvp: string
}

export function ManageEventGuestsDialog({
  event,
  open,
  onOpenChange,
}: ManageEventGuestsDialogProps) {
  const utils = api.useUtils()
  const [search, setSearch] = useState('')
  const [guestStates, setGuestStates] = useState<Map<number, GuestInviteState>>(new Map())
  const [initialized, setInitialized] = useState(false)

  const { data: dashboardData, isLoading } = api.dashboard.getForActiveWorkspace.useQuery(
    undefined,
    {
      enabled: open,
      staleTime: 30_000,
    }
  )

  // Build guest states from dashboard data when it loads
  if (dashboardData && !initialized) {
    const states = new Map<number, GuestInviteState>()
    for (const household of dashboardData.households) {
      for (const guest of household.guests) {
        const invitation = guest.invitations?.find((inv) => inv.eventId === event.id)
        const currentRsvp = invitation?.rsvp ?? 'Not Invited'
        states.set(guest.id, {
          guestId: guest.id,
          eventId: event.id,
          firstName: guest.firstName,
          lastName: guest.lastName,
          currentRsvp,
          newRsvp: currentRsvp,
        })
      }
    }
    setGuestStates(states)
    setInitialized(true)
  }

  // Reset when dialog closes
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setInitialized(false)
        setGuestStates(new Map())
        setSearch('')
      }
      onOpenChange(newOpen)
    },
    [onOpenChange]
  )

  const filteredGuests = useMemo(() => {
    const guests = Array.from(guestStates.values())
    if (!search) return guests
    const lower = search.toLowerCase()
    return guests.filter(
      (g) => g.firstName.toLowerCase().includes(lower) || g.lastName.toLowerCase().includes(lower)
    )
  }, [guestStates, search])

  const changedInvitations = useMemo(() => {
    return Array.from(guestStates.values()).filter((g) => g.newRsvp !== g.currentRsvp)
  }, [guestStates])

  const toggleGuest = useCallback((guestId: number) => {
    setGuestStates((prev) => {
      const next = new Map(prev)
      const guest = next.get(guestId)
      if (!guest) return prev
      // Only toggle between "Not Invited" and "Invited"
      // Don't change guests who are "Attending" or "Declined"
      if (guest.currentRsvp === 'Attending' || guest.currentRsvp === 'Declined') return prev
      next.set(guestId, {
        ...guest,
        newRsvp: guest.newRsvp === 'Not Invited' ? 'Invited' : 'Not Invited',
      })
      return next
    })
  }, [])

  const inviteAll = useCallback(() => {
    setGuestStates((prev) => {
      const next = new Map(prev)
      for (const [id, guest] of next) {
        if (guest.currentRsvp === 'Attending' || guest.currentRsvp === 'Declined') continue
        next.set(id, { ...guest, newRsvp: 'Invited' })
      }
      return next
    })
  }, [])

  const uninviteAll = useCallback(() => {
    setGuestStates((prev) => {
      const next = new Map(prev)
      for (const [id, guest] of next) {
        if (guest.currentRsvp === 'Attending' || guest.currentRsvp === 'Declined') continue
        next.set(id, { ...guest, newRsvp: 'Not Invited' })
      }
      return next
    })
  }, [])

  const bulkUpdate = api.invitation.bulkUpdate.useMutation({
    onSuccess: async () => {
      await utils.dashboard.getForActiveWorkspace.invalidate()
      await utils.event.getAllByUserIdWithStats.invalidate()
      toast.success('Guest list updated', {
        description: `Updated ${changedInvitations.length} invitation${changedInvitations.length === 1 ? '' : 's'} for ${event.name}.`,
      })
      handleOpenChange(false)
    },
    onError: (error) => {
      toast.error('Failed to update guest list', {
        description: error.message,
      })
    },
  })

  const handleSave = () => {
    if (changedInvitations.length === 0) {
      handleOpenChange(false)
      return
    }
    bulkUpdate.mutate({
      invitations: changedInvitations.map((g) => ({
        guestId: g.guestId,
        eventId: g.eventId,
        rsvp: g.newRsvp,
      })),
    })
  }

  const invitedCount = useMemo(
    () =>
      Array.from(guestStates.values()).filter(
        (g) => g.newRsvp === 'Invited' || g.newRsvp === 'Attending' || g.newRsvp === 'Declined'
      ).length,
    [guestStates]
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-h-[80vh] sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Manage Guests — {event.name}</DialogTitle>
          <DialogDescription>
            Select which guests to add to this event. This does not send invitations.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3'>
          <div className='relative'>
            <Search className='absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search guests...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9'
            />
          </div>

          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>
              {invitedCount} of {guestStates.size} guests invited
            </span>
            <div className='flex gap-2'>
              <Button variant='outline' size='sm' className='text-xs' onClick={inviteAll}>
                Invite All
              </Button>
              <Button variant='outline' size='sm' className='text-xs' onClick={uninviteAll}>
                Uninvite All
              </Button>
            </div>
          </div>

          <div className='max-h-[40vh] space-y-1 overflow-y-auto rounded-md border p-2'>
            {isLoading ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
              </div>
            ) : filteredGuests.length === 0 ? (
              <p className='py-4 text-center text-muted-foreground text-sm'>
                {search ? 'No guests match your search.' : 'No guests added yet.'}
              </p>
            ) : (
              filteredGuests.map((guest) => {
                const locked = guest.currentRsvp === 'Attending' || guest.currentRsvp === 'Declined'
                const invited =
                  guest.newRsvp === 'Invited' ||
                  guest.newRsvp === 'Attending' ||
                  guest.newRsvp === 'Declined'
                const checkboxId = `guest-invite-${guest.guestId}`
                return (
                  <label
                    key={guest.guestId}
                    htmlFor={checkboxId}
                    className={`flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/50 ${locked ? 'cursor-default opacity-60' : ''}`}
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={invited}
                      disabled={locked}
                      onCheckedChange={() => toggleGuest(guest.guestId)}
                    />
                    <span className='flex-1 text-sm'>
                      {guest.firstName} {guest.lastName}
                    </span>
                    {locked && (
                      <span className='text-muted-foreground text-xs'>{guest.currentRsvp}</span>
                    )}
                  </label>
                )
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={bulkUpdate.isPending || changedInvitations.length === 0}
          >
            {bulkUpdate.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {changedInvitations.length > 0
              ? `Save (${changedInvitations.length} change${changedInvitations.length === 1 ? '' : 's'})`
              : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
