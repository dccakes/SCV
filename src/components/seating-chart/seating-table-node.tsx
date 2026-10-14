'use client'

import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useMemo } from 'react'

import {
  type DragData,
  getInitials,
  guestDragData,
  type TableDropData,
} from '~/components/seating-chart/seating-dnd'
import {
  getSeatPositions,
  getTableFootprint,
  getTableSurface,
  SEAT_SIZE,
} from '~/components/seating-chart/seating-layout'
import { cn } from '~/lib/utils'
import { tableHasRoom } from '~/server/domains/seating/seating.rules'
import type { SeatingGuest, SeatingTableView } from '~/server/domains/seating/seating.types'

type SeatingTableNodeProps = {
  table: SeatingTableView
  guestsById: ReadonlyMap<number, SeatingGuest>
  onEdit: (tableId: string) => void
  onSelectGuest: (guestId: number) => void
}

function SeatedGuest(
  props: Readonly<{ guest: SeatingGuest; x: number; y: number; onSelect: () => void }>
) {
  const { guest, x, y, onSelect } = props
  const data = guestDragData(guest)
  const name = data.label
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `seat-guest:${guest.id}`,
    data,
  })

  return (
    <button
      ref={setNodeRef}
      type='button'
      title={name}
      aria-label={`${name}. Press Space to move, or Enter for details.`}
      onClick={onSelect}
      {...attributes}
      {...listeners}
      style={{
        left: x - SEAT_SIZE / 2,
        top: y - SEAT_SIZE / 2,
        width: SEAT_SIZE,
        height: SEAT_SIZE,
      }}
      className={cn(
        'absolute flex touch-none items-center justify-center rounded-full border border-foreground/30 bg-card font-mono text-[0.6rem] text-foreground shadow-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isDragging && 'opacity-30'
      )}
    >
      {getInitials(guest)}
    </button>
  )
}

export function SeatingTableNode(props: Readonly<SeatingTableNodeProps>) {
  const { table, guestsById, onEdit, onSelectGuest } = props
  const { footprint, surface, seats } = useMemo(
    () => ({
      footprint: getTableFootprint(table.shape, table.capacity),
      surface: getTableSurface(table.shape, table.capacity),
      seats: getSeatPositions(table.shape, table.capacity),
    }),
    [table.shape, table.capacity]
  )
  const seatedGuests = table.guestIds
    .map((id) => guestsById.get(id))
    .filter((guest): guest is SeatingGuest => guest !== undefined)

  const dragData: DragData = { type: 'table', tableId: table.id }
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({ id: `table:${table.id}`, data: dragData })

  const dropData: TableDropData = { type: 'table', tableId: table.id }
  // useDroppable's `active` only changes on drag start/end, unlike useDndContext,
  // which re-renders every table on every pointer move
  const {
    setNodeRef: setDropRef,
    isOver,
    active,
  } = useDroppable({ id: `table-drop:${table.id}`, data: dropData })

  const activeData = active?.data.current as DragData | undefined
  // Only guest drags target a table; a table dragged over another gets no cue
  const isGuestOver = isOver && activeData?.type === 'guests'
  const fits = !isGuestOver || tableHasRoom(table, activeData.guestIds)

  return (
    <div
      ref={setDropRef}
      className='absolute'
      style={{
        left: table.positionX,
        top: table.positionY,
        width: footprint.width,
        height: footprint.height,
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 20 : undefined,
      }}
    >
      {seats.map((seat, index) => {
        const guest = seatedGuests[index]
        return guest ? (
          <SeatedGuest
            key={guest.id}
            guest={guest}
            x={seat.x}
            y={seat.y}
            onSelect={() => onSelectGuest(guest.id)}
          />
        ) : (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: empty seats have no identity
            key={`empty-${index}`}
            aria-hidden='true'
            className='absolute rounded-full border border-foreground/25 border-dashed'
            style={{
              left: seat.x - SEAT_SIZE / 2,
              top: seat.y - SEAT_SIZE / 2,
              width: SEAT_SIZE,
              height: SEAT_SIZE,
            }}
          />
        )
      })}

      <button
        ref={setDragRef}
        type='button'
        aria-label={`${table.name}, ${table.guestIds.length} of ${table.capacity} seats filled. Press Space to move, or Enter to edit.`}
        onClick={() => onEdit(table.id)}
        {...attributes}
        {...listeners}
        style={{
          width: surface.width,
          height: surface.height,
          left: (footprint.width - surface.width) / 2,
          top: (footprint.height - surface.height) / 2,
        }}
        className={cn(
          'absolute flex cursor-grab touch-none flex-col items-center justify-center border-2 bg-card px-2 text-center shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing',
          table.shape === 'ROUND' ? 'rounded-full' : 'rounded-md',
          isGuestOver && fits && 'border-success bg-success/10',
          isGuestOver && !fits && 'border-destructive bg-destructive/10',
          !isGuestOver && 'border-foreground/40'
        )}
      >
        <span className='line-clamp-2 font-medium text-foreground text-xs leading-tight'>
          {table.name}
        </span>
        <span
          className={cn(
            'font-mono text-[0.6rem]',
            table.guestIds.length >= table.capacity ? 'text-success' : 'text-muted-foreground'
          )}
        >
          {table.guestIds.length}/{table.capacity}
        </span>
      </button>
    </div>
  )
}
