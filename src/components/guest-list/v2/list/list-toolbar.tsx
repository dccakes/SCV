import { ArrowUpDown, Users } from 'lucide-react'

import { Button } from '~/components/ui/button'

type ListToolbarProps = {
  totalHouseholds: number
  onSortByName?: () => void
  onSortByPartySize?: () => void
}

export function ListToolbar({
  totalHouseholds,
  onSortByName,
  onSortByPartySize,
}: Readonly<ListToolbarProps>) {
  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex items-center gap-2 text-muted-foreground text-sm'>
        <Users className='h-4 w-4' aria-hidden='true' />
        <span>
          {totalHouseholds} {totalHouseholds === 1 ? 'household' : 'households'}
        </span>
      </div>

      <div className='flex flex-wrap gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={onSortByName}
          className='font-sans text-sm normal-case tracking-normal'
        >
          <ArrowUpDown className='mr-2 h-3 w-3' aria-hidden='true' />
          Sort by Name
        </Button>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={onSortByPartySize}
          className='font-sans text-sm normal-case tracking-normal'
        >
          <ArrowUpDown className='mr-2 h-3 w-3' aria-hidden='true' />
          Sort by Party Size
        </Button>
      </div>
    </div>
  )
}
