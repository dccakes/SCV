'use client'

import { Loader2, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { RSVP_STATUS, type RsvpStatus } from '~/lib/constants/rsvp'
import type { EventWithStats } from '~/server/domains/event/event.types'
import { api } from '~/trpc/react'

type ManageEventGuestsDialogProps = Readonly<{
  event: EventWithStats
  open: boolean
  onOpenChange: (open: boolean) => void
}>

type GuestInviteState = {
  guestId: number
  firstName: string
  lastName: string
  currentRsvp: RsvpStatus
  newRsvp: RsvpStatus
}

const isRsvpLocked = (rsvp: RsvpStatus) =>
  rsvp === RSVP_STATUS.ATTENDING || rsvp === RSVP_STATUS.DECLINED

export function ManageEventGuestsDialog({
  event,
  open,
  onOpenChange,
}: ManageEventGuestsDialogProps) {
  const utils = api.useUtils()
  const [search, setSearch] = useState('')
  const [guestStates, setGuestStates] = useState<Map<number, GuestInviteState>>(new Map())

  const { data: dashboardData, isLoading } = api.dashboard.getForActiveWorkspace.useQuery(
    undefined,
    {
      enabled: open,
      staleTime: 30_000,
    }
  )

  // Initialize guest states when dashboard data loads
  useEffect(() => {
    if (!dashboardData) return
    const states = new Map<number, GuestInviteState>()
    for (const household of dashboardData.households) {
      for (const guest of household.guests) {
        const invitation = guest.invitations?.find((inv) => inv.eventId === event.id)
        const currentRsvp = (invitation?.rsvp ?? RSVP_STATUS.NOT_INVITED) as RsvpStatus
        states.set(guest.id, {
          guestId: guest.id,
          firstName: guest.firstName,
          lastName: guest.lastName,
          currentRsvp,
          newRsvp: currentRsvp,
        })
      }
    }
    setGuestStates(states)
  }, [dashboardData, event.id])

  // Reset when dialog closes
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setGuestStates(new Map())
        setSearch('')
      }
      onOpenChange(newOpen)
    },
    [onOpenChange]
  )

  const allGuests = useMemo(() => Array.from(guestStates.values()), [guestStates])

  const filteredGuests = useMemo(() => {
    if (!search) return allGuests
    const lower = search.toLowerCase()
    return allGuests.filter(
      (g) => g.firstName.toLowerCase().includes(lower) || g.lastName.toLowerCase().includes(lower)
    )
  }, [allGuests, search])

  const changedInvitations = useMemo(
    () => allGuests.filter((g) => g.newRsvp !== g.currentRsvp),
    [allGuests]
  )

  const toggleGuest = useCallback((guestId: number) => {
    setGuestStates((prev) => {
      const guest = prev.get(guestId)
      if (!guest || isRsvpLocked(guest.currentRsvp)) return prev
      const next = new Map(prev)
      next.set(guestId, {
        ...guest,
        newRsvp:
          guest.newRsvp === RSVP_STATUS.NOT_INVITED ? RSVP_STATUS.INVITED : RSVP_STATUS.NOT_INVITED,
      })
      return next
    })
  }, [])

  const setAllRsvp = useCallback((targetRsvp: RsvpStatus) => {
    setGuestStates((prev) => {
      let changed = false
      const next = new Map(prev)
      for (const [id, guest] of next) {
        if (isRsvpLocked(guest.currentRsvp)) continue
        if (guest.newRsvp === targetRsvp) continue
        changed = true
        next.set(id, { ...guest, newRsvp: targetRsvp })
      }
      return changed ? next : prev
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
        eventId: event.id,
        rsvp: g.newRsvp,
      })),
    })
  }

  const invitedCount = useMemo(
    () => allGuests.filter((g) => g.newRsvp !== RSVP_STATUS.NOT_INVITED).length,
    [allGuests]
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

          <div className='flex flex-wrap items-center justify-between gap-2 text-sm'>
            <span className='text-muted-foreground text-xs sm:text-sm'>
              {invitedCount} of {guestStates.size} invited
            </span>
            <div className='flex gap-1.5'>
              <Button
                variant='outline'
                size='sm'
                className='h-7 px-2 text-xs'
                onClick={() => setAllRsvp(RSVP_STATUS.INVITED)}
              >
                Invite All
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='h-7 px-2 text-xs'
                onClick={() => setAllRsvp(RSVP_STATUS.NOT_INVITED)}
              >
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
                const locked = isRsvpLocked(guest.currentRsvp)
                const invited = guest.newRsvp !== RSVP_STATUS.NOT_INVITED
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
