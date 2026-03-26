'use client'

import { memo, useCallback } from 'react'
import { Badge } from '~/components/ui/badge'
import type { HouseholdWithGuests } from '~/server/application/dashboard/dashboard.types'

type GuestIndividualTableProps = {
  households: HouseholdWithGuests[]
  householdNumberMap: Map<string, number>
  onSelectHousehold: (household: HouseholdWithGuests) => void
  selectedHouseholdId?: string
  allTags?: Array<{ id: string; name: string; color?: string | null }>
}

function GuestIndividualTableComponent({
  households,
  householdNumberMap,
  onSelectHousehold,
  selectedHouseholdId,
  allTags = [],
}: Readonly<GuestIndividualTableProps>) {
  return (
    <div className='overflow-x-auto rounded-md border border-border'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-border border-b bg-muted/40'>
            <th className='px-4 py-3 text-left font-mono text-[0.58rem] text-foreground/55 uppercase tracking-widest'>
              First Name
            </th>
            <th className='px-4 py-3 text-left font-mono text-[0.58rem] text-foreground/55 uppercase tracking-widest'>
              Last Name
            </th>
            <th className='px-4 py-3 text-left font-mono text-[0.58rem] text-foreground/55 uppercase tracking-widest'>
              Email
            </th>
            <th className='px-4 py-3 text-left font-mono text-[0.58rem] text-foreground/55 uppercase tracking-widest'>
              Phone
            </th>
            <th className='px-4 py-3 text-left font-mono text-[0.58rem] text-foreground/55 uppercase tracking-widest'>
              Tags
            </th>
            <th className='px-4 py-3 text-left font-mono text-[0.58rem] text-foreground/55 uppercase tracking-widest'>
              Household
            </th>
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
                allTags={allTags}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

type GuestTableRowProps = {
  guest: HouseholdWithGuests['guests'][number]
  household: HouseholdWithGuests
  householdNumber: number
  isSelected: boolean
  onSelectHousehold: (household: HouseholdWithGuests) => void
  allTags: Array<{ id: string; name: string; color?: string | null }>
}

const GuestTableRow = memo(function GuestTableRow({
  guest,
  household,
  householdNumber,
  isSelected,
  onSelectHousehold,
  allTags,
}: Readonly<GuestTableRowProps>) {
  const guestTags = (guest.guestTags ?? [])
    .map((gt) => allTags.find((t) => t.id === gt.tagId))
    .filter((t): t is NonNullable<typeof t> => t !== undefined)

  const handleClick = useCallback(() => {
    onSelectHousehold(household)
  }, [household, onSelectHousehold])

  return (
    <tr
      onClick={handleClick}
      className={`cursor-pointer border-border border-b last:border-0 transition-colors hover:bg-muted/30 ${
        isSelected ? 'bg-primary/5' : ''
      }`}
    >
      <td className='px-4 py-3 font-medium text-foreground'>{guest.firstName}</td>
      <td className='px-4 py-3 text-foreground/80'>{guest.lastName}</td>
      <td className='px-4 py-3 text-foreground/70'>{guest.email ?? <span className='text-foreground/35'>—</span>}</td>
      <td className='px-4 py-3 text-foreground/70'>{guest.phone ?? <span className='text-foreground/35'>—</span>}</td>
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
        <span className='font-mono text-foreground/60 text-xs'>#{householdNumber}</span>
      </td>
    </tr>
  )
})

export const GuestIndividualTable = memo(GuestIndividualTableComponent)
