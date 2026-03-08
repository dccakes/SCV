import { memo, useCallback } from 'react'

import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import type { HouseholdWithGuests } from '~/server/application/dashboard/dashboard.types'

type GuestCardProps = {
  household: HouseholdWithGuests
  onSelectHousehold: (household: HouseholdWithGuests) => void
  isSelected?: boolean
}

type RsvpSummary = {
  attending: number
  invited: number
  declined: number
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

const getLocationLabel = (household: HouseholdWithGuests): string => {
  const locationParts = [household.city, household.state, household.country].filter(
    (value): value is string => Boolean(value)
  )

  if (locationParts.length === 0) return 'Location not set'

  return locationParts.join(', ')
}

const getHouseholdTags = (household: HouseholdWithGuests): string[] => {
  return Array.from(
    new Set(
      household.guests
        .flatMap((guest) => guest.guestTags ?? [])
        .map((guestTag) => guestTag.tagId)
        .filter(Boolean)
    )
  ).slice(0, 2)
}

const getRsvpSummary = (household: HouseholdWithGuests): RsvpSummary => {
  // Include all guests — tag-alongs now have invitations for events that allow them
  return household.guests.reduce<RsvpSummary>(
    (summary, guest) => {
      for (const invitation of guest.invitations) {
        if (invitation.rsvp === 'Attending') {
          summary.attending += 1
          continue
        }

        if (invitation.rsvp === 'Invited') {
          summary.invited += 1
          continue
        }

        if (invitation.rsvp === 'Declined') {
          summary.declined += 1
        }
      }

      return summary
    },
    {
      attending: 0,
      invited: 0,
      declined: 0,
    }
  )
}

const getPrimaryGuestName = (household: HouseholdWithGuests): string => {
  const primaryGuest =
    household.guests.find((guest) => guest.isPrimaryContact) ?? household.guests[0]

  if (primaryGuest === undefined) return 'Unnamed household'

  return `${primaryGuest.firstName} ${primaryGuest.lastName}`
}

function GuestCardComponent({
  household,
  onSelectHousehold,
  isSelected = false,
}: Readonly<GuestCardProps>) {
  const primaryGuestName = getPrimaryGuestName(household)
  const invitedGuests = household.guests.filter((guest) => !guest.isTagAlong)
  const tagAlongCount = household.guests.length - invitedGuests.length
  const extraGuestsCount = Math.max(household.guests.length - 1, 0)
  const summaryName =
    extraGuestsCount > 0 ? `${primaryGuestName} +${extraGuestsCount}` : primaryGuestName

  const rsvpSummary = getRsvpSummary(household)
  const initials = getInitials(primaryGuestName)
  const locationLabel = getLocationLabel(household)
  const householdTags = getHouseholdTags(household)
  const partyPreview = household.guests.slice(0, 4)
  const handleSelect = useCallback(() => {
    onSelectHousehold(household)
  }, [household, onSelectHousehold])

  return (
    <button
      type='button'
      className='w-full text-left'
      aria-label={`Select ${primaryGuestName} household`}
      onClick={handleSelect}
    >
      <Card
        className={`transition-colors hover:bg-muted/30 ${
          isSelected
            ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
            : 'border-border bg-card/90'
        }`}
      >
        <CardContent className='flex flex-col gap-3 p-4'>
          <div className='flex items-start justify-between gap-3'>
            <div className='flex min-w-0 items-start gap-2.5'>
              <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted/60 font-mono text-[0.58rem] text-foreground/75 uppercase tracking-wider'>
                {initials}
              </span>
              <div className='min-w-0'>
                <p className='truncate font-serif text-[1.02rem] text-foreground leading-tight'>
                  {summaryName}
                </p>
                <p className='truncate font-mono text-[0.56rem] text-foreground/55 uppercase tracking-wider'>
                  {locationLabel}
                </p>
              </div>
            </div>
            <Badge
              variant='secondary'
              className='shrink-0 font-mono text-[0.54rem] uppercase tracking-wider'
            >
              Party of {invitedGuests.length}
              {tagAlongCount > 0 && ` +${tagAlongCount}`}
            </Badge>
          </div>

          <div className='flex flex-wrap gap-2 text-xs'>
            {rsvpSummary.attending > 0 && (
              <Badge
                variant='outline'
                className='border-success/35 bg-success/12 font-normal text-success'
              >
                {rsvpSummary.attending} attending
              </Badge>
            )}
            {rsvpSummary.invited > 0 && (
              <Badge
                variant='outline'
                className='border-foreground/20 bg-accent/12 font-normal text-foreground/80'
              >
                {rsvpSummary.invited} invited
              </Badge>
            )}
            {rsvpSummary.declined > 0 && (
              <Badge
                variant='outline'
                className='border-destructive/30 bg-destructive/10 font-normal text-destructive'
              >
                {rsvpSummary.declined} declined
              </Badge>
            )}
            {householdTags.map((tag) => (
              <Badge
                key={tag}
                variant='outline'
                className='border-foreground/15 bg-foreground/[0.04] font-normal text-foreground/70'
              >
                {tag}
              </Badge>
            ))}
            {rsvpSummary.attending === 0 &&
              rsvpSummary.invited === 0 &&
              rsvpSummary.declined === 0 && (
                <span className='text-muted-foreground'>No RSVP data</span>
              )}
          </div>

          <div className='flex items-center gap-1.5 border-border/80 border-t pt-2'>
            <span className='font-mono text-[0.52rem] text-foreground/55 uppercase tracking-widest'>
              Party
            </span>
            <div className='flex items-center'>
              {partyPreview.map((guest, index) => {
                const partyInitials = getInitials(`${guest.firstName} ${guest.lastName}`)
                return (
                  <span
                    key={`${guest.id}-${index}`}
                    className={`-ml-1.5 flex h-5 w-5 items-center justify-center rounded-full font-mono text-[0.45rem] uppercase first:ml-0 ${
                      guest.isTagAlong
                        ? 'border border-foreground/30 border-dashed bg-muted/40 text-foreground/45'
                        : 'border border-card bg-muted text-foreground/65'
                    }`}
                  >
                    {partyInitials}
                  </span>
                )
              })}
            </div>
            <span className='font-mono text-[0.56rem] text-foreground/55 tracking-wider'>
              {household.guests.length} people
            </span>
          </div>
        </CardContent>
      </Card>
    </button>
  )
}

export const GuestCard = memo(GuestCardComponent)
