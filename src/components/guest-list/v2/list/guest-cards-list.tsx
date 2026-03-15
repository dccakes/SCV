import { memo } from 'react'

import { GuestCard } from '~/components/guest-list/v2/list/guest-card'
import { Card, CardContent } from '~/components/ui/card'
import type { HouseholdWithGuests } from '~/server/application/dashboard/dashboard.types'

type GuestCardsListProps = {
  households: HouseholdWithGuests[]
  onSelectHousehold: (household: HouseholdWithGuests) => void
  selectedHouseholdId?: string
  emptyMessage?: string
  allTags?: Array<{ id: string; name: string; color?: string | null }>
}

function GuestCardsListComponent({
  households,
  onSelectHousehold,
  selectedHouseholdId,
  emptyMessage = 'No households yet',
  allTags = [],
}: Readonly<GuestCardsListProps>) {
  if (households.length === 0) {
    return (
      <Card>
        <CardContent className='p-4'>
          <p className='text-muted-foreground text-sm'>{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
      {households.map((household) => (
        <GuestCard
          key={household.id}
          household={household}
          onSelectHousehold={onSelectHousehold}
          isSelected={selectedHouseholdId === household.id}
          allTags={allTags}
        />
      ))}
    </div>
  )
}

export const GuestCardsList = memo(GuestCardsListComponent)
