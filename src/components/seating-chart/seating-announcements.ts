import type { Announcements, ScreenReaderInstructions } from '@dnd-kit/core'

import type { DragData, DropData } from '~/components/seating-chart/seating-dnd'
import { getOpenSeats, tableHasRoom } from '~/server/domains/seating/seating.rules'

type TableInfo = { name: string; capacity: number; guestIds: readonly number[] }

export const SEATING_SCREEN_READER_INSTRUCTIONS: ScreenReaderInstructions = {
  draggable:
    'To pick up a guest, household or table, press Space. Use the arrow keys to move it, ' +
    'Space to drop, and Escape to cancel. Press Enter instead to open details.',
}

/**
 * Spoken feedback for keyboard and screen reader drags, using guest and table
 * names (dnd-kit's defaults read out internal ids).
 */
export const createSeatingAnnouncements = (
  getTable: (tableId: string) => TableInfo | undefined
): Announcements => {
  const dragOf = (active: { data: { current?: unknown } }) =>
    active.data.current as DragData | undefined
  const dropOf = (over: { data: { current?: unknown } } | null) =>
    over?.data.current as DropData | undefined

  const nameOf = (data: DragData | undefined) => {
    if (data?.type === 'guests') return data.label
    if (data?.type === 'table') return getTable(data.tableId)?.name ?? 'table'
    return 'item'
  }

  const tableFor = (drop: DropData | undefined) =>
    drop?.type === 'table' ? getTable(drop.tableId) : undefined

  return {
    onDragStart: ({ active }) => {
      const data = dragOf(active)
      const how = data?.type === 'table' ? 'move it' : 'move onto a table'
      return `Picked up ${nameOf(data)}. Use the arrow keys to ${how}, Space to drop, Escape to cancel.`
    },
    onDragOver: ({ active, over }) => {
      const data = dragOf(active)
      if (data?.type !== 'guests') return undefined
      const drop = dropOf(over)
      if (drop?.type === 'unassigned') return `${data.label} is over the unseated guests list.`
      const table = tableFor(drop)
      if (!table) return `${data.label} is not over a table.`
      if (!tableHasRoom(table, data.guestIds)) {
        return `${data.label} is over ${table.name}, not enough seats.`
      }
      const open = getOpenSeats(table)
      return `${data.label} is over ${table.name}, ${open} open seat${open === 1 ? '' : 's'}.`
    },
    onDragEnd: ({ active, over }) => {
      const data = dragOf(active)
      // Neutral wording: dnd-kit does not pass the drag distance here, so a
      // table dropped in place cannot be told apart from one that moved
      if (data?.type !== 'guests') return `${nameOf(data)} dropped.`
      const drop = dropOf(over)
      if (drop?.type === 'unassigned') return `${data.label} moved to unseated guests.`
      const table = tableFor(drop)
      if (!table) return `${data.label} was not dropped on a table and was not moved.`
      if (!tableHasRoom(table, data.guestIds)) {
        return `Not enough seats at ${table.name}. ${data.label} was not moved.`
      }
      return `${data.label} seated at ${table.name}.`
    },
    onDragCancel: ({ active }) => `Moving ${nameOf(dragOf(active))} was cancelled.`,
  }
}
