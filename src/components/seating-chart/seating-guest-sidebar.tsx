'use client'

import { useDraggable, useDroppable } from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  type GuestDragData,
  guestDragData,
  UNASSIGNED_DROP_ID,
  type UnassignedDropData,
} from '~/components/seating-chart/seating-dnd'
import { Input } from '~/components/ui/input'
import { formatGuestName } from '~/lib/seating/guest-name'
import { cn } from '~/lib/utils'
import type { SeatingGuest, SeatingHousehold } from '~/server/domains/seating/seating.types'

type SeatingGuestSidebarProps = {
  households: SeatingHousehold[]
  totalGuests: number
  seatedGuests: number
  onSelectGuest: (guestId: number) => void
}

function DraggableGuest(props: Readonly<{ guest: SeatingGuest; onSelect: () => void }>) {
  const { guest, onSelect } = props
  const data = guestDragData(guest)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-guest:${guest.id}`,
    data,
  })

  return (
    <li>
      <button
        ref={setNodeRef}
        type='button'
        data-seating-focus-key={`sidebar-guest:${guest.id}`}
        data-seating-guest-ids={guest.id}
        onClick={onSelect}
        aria-label={`${formatGuestName(guest)}. Press Space to move onto a table, or Enter for details.`}
        {...attributes}
        {...listeners}
        className={cn(
          'flex w-full touch-manipulation items-center gap-2 rounded-[4px] px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isDragging && 'opacity-30'
        )}
      >
        <GripVertical className='h-3.5 w-3.5 shrink-0 text-muted-foreground' aria-hidden='true' />
        <span className='truncate'>{formatGuestName(guest)}</span>
        {guest.isTagAlong ? (
          <span className='ml-auto font-mono text-[0.6rem] text-muted-foreground'>+1</span>
        ) : null}
      </button>
    </li>
  )
}

function HouseholdGroup(
  props: Readonly<{
    household: SeatingHousehold
    // Every unseated member: what dragging the header moves
    unassigned: SeatingGuest[]
    // The unseated members matching the search: what is listed
    visible: SeatingGuest[]
    onSelectGuest: (guestId: number) => void
  }>
) {
  const { household, unassigned, visible, onSelectGuest } = props
  const lead = household.guests[0]
  const label = lead ? `${lead.lastName} household` : 'Household'
  const data: GuestDragData = {
    type: 'guests',
    guestIds: unassigned.map((guest) => guest.id),
    label: `${label} (${unassigned.length})`,
  }
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `household:${household.id}`,
    data,
  })

  return (
    <li className={cn('rounded-md border border-border/70 bg-card', isDragging && 'opacity-40')}>
      <button
        type='button'
        ref={setNodeRef}
        data-seating-focus-key={`household:${household.id}`}
        data-seating-guest-ids={data.guestIds.join(',')}
        {...attributes}
        {...listeners}
        aria-label={`${label}, ${unassigned.length} unseated. Press Space to move everyone together.`}
        className='flex w-full cursor-grab touch-manipulation items-center justify-between gap-2 border-border/70 border-b px-2 py-1.5 active:cursor-grabbing'
      >
        <span className='flex items-center gap-1.5 font-mono text-[0.64rem] text-foreground/70 uppercase tracking-widest'>
          <GripVertical className='h-3.5 w-3.5' aria-hidden='true' />
          {label}
        </span>
        <span className='font-mono text-[0.6rem] text-muted-foreground'>
          {unassigned.length}/{household.guests.length}
        </span>
      </button>
      <ul className='p-1'>
        {visible.map((guest) => (
          <DraggableGuest key={guest.id} guest={guest} onSelect={() => onSelectGuest(guest.id)} />
        ))}
      </ul>
    </li>
  )
}

export function SeatingGuestSidebar(props: Readonly<SeatingGuestSidebarProps>) {
  const { households, totalGuests, seatedGuests, onSelectGuest } = props
  const [search, setSearch] = useState('')
  const dropData: UnassignedDropData = { type: 'unassigned' }
  const { setNodeRef, isOver } = useDroppable({ id: UNASSIGNED_DROP_ID, data: dropData })

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase()
    return households
      .map((household) => {
        const unassigned = household.guests.filter((guest) => guest.tableId === null)
        // Search narrows what is listed, never what the household header moves
        const visible = unassigned.filter(
          (guest) => !query || formatGuestName(guest).toLowerCase().includes(query)
        )
        return { household, unassigned, visible }
      })
      .filter((group) => group.visible.length > 0)
  }, [households, search])

  return (
    <aside
      ref={setNodeRef}
      data-seating-sidebar
      aria-label='Unseated guests'
      className={cn(
        'flex h-[40vh] min-h-0 flex-col rounded-md border border-border/70 bg-background transition-colors lg:h-auto',
        isOver && 'border-foreground/50 bg-muted'
      )}
    >
      <div className='space-y-2 border-border/70 border-b p-3'>
        <div className='flex items-baseline justify-between'>
          <h2 className='font-medium text-sm'>Unseated guests</h2>
          <span className='font-mono text-[0.64rem] text-muted-foreground'>
            {seatedGuests}/{totalGuests} seated
          </span>
        </div>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder='Search guests'
          aria-label='Search unseated guests'
          className='h-9'
        />
      </div>
      <div className='min-h-0 flex-1 overflow-y-auto p-2'>
        {groups.length === 0 ? (
          <p className='px-2 py-6 text-center text-muted-foreground text-sm'>
            {totalGuests === 0
              ? 'No invited guests for this event yet.'
              : search
                ? 'No unseated guests match your search.'
                : 'Everyone has a seat. Drag a guest here to unseat them.'}
          </p>
        ) : (
          <ul className='space-y-2'>
            {groups.map((group) => (
              <HouseholdGroup
                key={group.household.id}
                household={group.household}
                unassigned={group.unassigned}
                visible={group.visible}
                onSelectGuest={onSelectGuest}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
