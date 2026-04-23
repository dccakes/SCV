'use client'

import { memo, useCallback, useMemo } from 'react'
import { Badge } from '~/components/ui/badge'
import type { HouseholdWithGuests } from '~/server/application/dashboard/dashboard.types'

type TagMap = Map<string, { id: string; name: string; color?: string | null }>

type GuestIndividualTableProps = {
  households: HouseholdWithGuests[]
  householdNumberMap: Map<string, number>
  onSelectHousehold: (household: HouseholdWithGuests) => void
  selectedHouseholdId?: string
  allTags?: Array<{ id: string; name: string; color?: string | null }>
}

const thClass =
  'px-4 py-3 text-left font-mono text-[0.58rem] text-foreground/55 uppercase tracking-widest'

export const GuestIndividualTable = memo(function GuestIndividualTable({
  households,
  householdNumberMap,
  onSelectHousehold,
  selectedHouseholdId,
  allTags = [],
}: Readonly<GuestIndividualTableProps>) {
  const tagMap: TagMap = useMemo(() => new Map(allTags.map((t) => [t.id, t])), [allTags])

  return (
    <div className='overflow-x-auto rounded-md border border-border'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-border border-b bg-muted/40'>
            <th className={thClass}>Person</th>
            <th className={thClass}>Household</th>
            <th className={thClass}>Email</th>
            <th className={thClass}>Tags</th>
            <th className={thClass}>RSVP</th>
            <th className={thClass}>Contact Complete</th>
            <th className={thClass}>Location Complete</th>
          </tr>
        </thead>
        <tbody>
          {households.flatMap((household) =>
            household.guests.map((guest) => (
              <GuestTableRow
                key={guest.id}
                guest={guest}
                household={household}
                householdNumber={householdNumberMap.get(household.id) ?? 0}
                isSelected={selectedHouseholdId === household.id}
                onSelectHousehold={onSelectHousehold}
                tagMap={tagMap}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
})

type GuestTableRowProps = {
  guest: HouseholdWithGuests['guests'][number]
  household: HouseholdWithGuests
  householdNumber: number
  isSelected: boolean
  onSelectHousehold: (household: HouseholdWithGuests) => void
  tagMap: TagMap
}

const GuestTableRow = memo(function GuestTableRow({
  guest,
  household,
  householdNumber,
  isSelected,
  onSelectHousehold,
  tagMap,
}: Readonly<GuestTableRowProps>) {
  const guestTags = (guest.guestTags ?? [])
    .map((gt) => tagMap.get(gt.tagId))
    .filter((t): t is NonNullable<typeof t> => t !== undefined)

  const handleClick = useCallback(() => {
    onSelectHousehold(household)
  }, [household, onSelectHousehold])

  const guestName = `${guest.firstName} ${guest.lastName}`.trim()
  const contactComplete = Boolean(guest.email && guest.phone)
  const locationComplete = Boolean(household.city && household.state && household.country)
  const rsvpSummary = guest.invitations.some((invitation) => invitation.rsvp === 'Attending')
    ? 'Attending'
    : guest.invitations.some((invitation) => invitation.rsvp === 'Declined')
      ? 'Declined'
      : guest.invitations.some((invitation) => invitation.rsvp === 'Invited')
        ? 'Invited'
        : 'Not Invited'

  return (
    <tr
      onClick={handleClick}
      className={`cursor-pointer border-border border-b transition-colors last:border-0 hover:bg-muted/30 ${
        isSelected ? 'bg-primary/5' : ''
      }`}
    >
      <td className='px-4 py-3 font-medium text-foreground'>{guestName}</td>
      <td className='px-4 py-3'>
        <span className='font-mono text-foreground/60 text-xs'>#{householdNumber}</span>
      </td>
      <td className='px-4 py-3 text-foreground/70'>
        {guest.email ?? <span className='text-foreground/35'>—</span>}
      </td>
      <td className='px-4 py-3'>
        {guestTags.length > 0 ? (
          <div className='flex flex-wrap gap-1'>
            {guestTags.map((tag) => (
              <Badge
                key={tag.id}
                variant='outline'
                className='border-foreground/15 bg-foreground/[0.04] text-[0.58rem] text-foreground/70 uppercase tracking-wider'
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        ) : (
          <span className='text-foreground/35'>—</span>
        )}
      </td>
      <td className='px-4 py-3'>
        <Badge variant='outline'>{rsvpSummary}</Badge>
      </td>
      <td className='px-4 py-3'>
        <span
          className={contactComplete ? 'font-medium text-success' : 'font-medium text-destructive'}
        >
          {contactComplete ? 'Complete' : 'Missing'}
        </span>
      </td>
      <td className='px-4 py-3'>
        <span
          className={locationComplete ? 'font-medium text-success' : 'font-medium text-destructive'}
        >
          {locationComplete ? 'Complete' : 'Missing'}
        </span>
      </td>
    </tr>
  )
})
