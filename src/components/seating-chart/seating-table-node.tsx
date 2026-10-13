'use client'

import { useDndContext, useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

import {
  type DragData,
  type GuestDragData,
  getInitials,
  type TableDropData,
} from '~/components/seating-chart/seating-dnd'
import {
  getSeatPositions,
  getTableFootprint,
  getTableSurface,
  SEAT_SIZE,
} from '~/components/seating-chart/seating-layout'
import { cn } from '~/lib/utils'
import { hasRoomForGuests } from '~/server/domains/seating/seating.rules'
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
  const name = `${guest.firstName} ${guest.lastName}`
  const data: GuestDragData = { type: 'guests', guestIds: [guest.id], label: name }
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `seat-guest:${guest.id}`,
    data,
  })

  return (
    <button
      ref={setNodeRef}
      type='button'
      title={name}
      aria-label={`${name}. Drag to move, or press to view details.`}
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
  const footprint = getTableFootprint(table.shape, table.capacity)
  const surface = getTableSurface(table.shape, table.capacity)
  const seats = getSeatPositions(table.shape, table.capacity)
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
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `table-drop:${table.id}`,
    data: dropData,
  })

  const { active } = useDndContext()
  const activeData = active?.data.current as DragData | undefined
  const incoming = activeData?.type === 'guests' ? activeData.guestIds : null
  const fits =
    incoming === null ||
    hasRoomForGuests({ capacity: table.capacity, seatedGuestIds: table.guestIds }, incoming)

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
        aria-label={`${table.name}, ${table.guestIds.length} of ${table.capacity} seats filled. Drag to move, or press to edit.`}
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
          isOver && fits && 'border-success bg-success/10',
          isOver && !fits && 'border-destructive bg-destructive/10',
          !isOver && 'border-foreground/40'
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
