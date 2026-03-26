import { ArrowUpDown, LayoutGrid, Table2, Users } from 'lucide-react'

import { Button } from '~/components/ui/button'

export type ViewMode = 'cards' | 'table'

type ListToolbarProps = {
  totalHouseholds: number
  onSortByName?: () => void
  onSortByPartySize?: () => void
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
}

export function ListToolbar({
  totalHouseholds,
  onSortByName,
  onSortByPartySize,
  viewMode = 'cards',
  onViewModeChange,
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
        {onViewModeChange && (
          <div className='flex rounded-md border border-border overflow-hidden'>
            <button
              type='button'
              aria-label='Card view'
              onClick={() => onViewModeChange('cards')}
              className={`flex items-center px-2.5 py-1.5 transition-colors ${
                viewMode === 'cards'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-foreground/60 hover:bg-muted/50'
              }`}
            >
              <LayoutGrid className='h-3.5 w-3.5' aria-hidden='true' />
            </button>
            <button
              type='button'
              aria-label='Table view'
              onClick={() => onViewModeChange('table')}
              className={`flex items-center border-border border-l px-2.5 py-1.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-foreground/60 hover:bg-muted/50'
              }`}
            >
              <Table2 className='h-3.5 w-3.5' aria-hidden='true' />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
