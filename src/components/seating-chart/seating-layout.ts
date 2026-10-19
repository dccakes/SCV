import type { SeatingTableShape } from '~/server/domains/seating/seating.types'

export const CANVAS_WIDTH = 2400
export const CANVAS_HEIGHT = 1600
export const SEAT_SIZE = 30

const SEAT_GAP = 6
const SEAT_PITCH = SEAT_SIZE + SEAT_GAP
const MIN_ROUND_DIAMETER = 84
const RECT_TABLE_DEPTH = 64
const MIN_RECT_LENGTH = 96
const PLACEMENT_MARGIN = 40
const PLACEMENT_GAP = 16
const PLACEMENT_STEP = 20

type Point = { x: number; y: number }
type Footprint = { width: number; height: number }

const getRoundDiameter = (capacity: number): number =>
  Math.max(MIN_ROUND_DIAMETER, Math.ceil((capacity * SEAT_PITCH) / Math.PI) - SEAT_SIZE)

const getRectLength = (capacity: number): number =>
  Math.max(MIN_RECT_LENGTH, Math.ceil(capacity / 2) * SEAT_PITCH + SEAT_GAP)

/**
 * Size of the table surface itself (without the ring of seats).
 */
export const getTableSurface = (shape: SeatingTableShape, capacity: number): Footprint => {
  if (shape === 'ROUND') {
    const diameter = getRoundDiameter(capacity)
    return { width: diameter, height: diameter }
  }
  return { width: getRectLength(capacity), height: RECT_TABLE_DEPTH }
}

/**
 * Size of the table plus its seats; this is what is positioned on the canvas.
 */
export const getTableFootprint = (shape: SeatingTableShape, capacity: number): Footprint => {
  const surface = getTableSurface(shape, capacity)
  const ring = (SEAT_SIZE + SEAT_GAP) * 2
  return { width: surface.width + ring, height: surface.height + ring }
}

/**
 * Seat centers relative to the footprint's top-left corner.
 */
export const getSeatPositions = (shape: SeatingTableShape, capacity: number): Point[] => {
  const footprint = getTableFootprint(shape, capacity)
  const center = { x: footprint.width / 2, y: footprint.height / 2 }

  if (shape === 'ROUND') {
    const radius = getRoundDiameter(capacity) / 2 + SEAT_GAP + SEAT_SIZE / 2
    return Array.from({ length: capacity }, (_, index) => {
      const angle = (index / capacity) * Math.PI * 2 - Math.PI / 2
      return { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) }
    })
  }

  const topCount = Math.ceil(capacity / 2)
  const surface = getTableSurface(shape, capacity)
  const left = center.x - surface.width / 2
  const topY = SEAT_SIZE / 2
  const bottomY = footprint.height - SEAT_SIZE / 2

  return Array.from({ length: capacity }, (_, index) => {
    const isTop = index < topCount
    const sideIndex = isTop ? index : index - topCount
    const sideCount = isTop ? topCount : capacity - topCount
    const spacing = surface.width / sideCount
    return { x: left + spacing * (sideIndex + 0.5), y: isTop ? topY : bottomY }
  })
}

export const clampTablePosition = (position: Point, footprint: Footprint): Point => ({
  x: Math.round(Math.min(Math.max(position.x, 0), CANVAS_WIDTH - footprint.width)),
  y: Math.round(Math.min(Math.max(position.y, 0), CANVAS_HEIGHT - footprint.height)),
})

/**
 * Where a new table goes: the first spot, scanning rows from the top left,
 * where its whole footprint fits on the canvas without touching any existing
 * table (with a small gap). Null when the floor plan has no room left.
 */
export const getNextTablePosition = (
  tables: ReadonlyArray<{
    positionX: number
    positionY: number
    shape: SeatingTableShape
    capacity: number
  }>,
  newTable: { shape: SeatingTableShape; capacity: number }
): Point | null => {
  const size = getTableFootprint(newTable.shape, newTable.capacity)
  // Existing footprints grown by the gap, so a hit means "too close"
  const occupied = tables.map((table) => {
    const footprint = getTableFootprint(table.shape, table.capacity)
    return {
      left: table.positionX - PLACEMENT_GAP,
      top: table.positionY - PLACEMENT_GAP,
      right: table.positionX + footprint.width + PLACEMENT_GAP,
      bottom: table.positionY + footprint.height + PLACEMENT_GAP,
    }
  })

  for (let y = PLACEMENT_MARGIN; y + size.height <= CANVAS_HEIGHT; y += PLACEMENT_STEP) {
    let x = PLACEMENT_MARGIN
    while (x + size.width <= CANVAS_WIDTH) {
      const blocker = occupied.find(
        (rect) =>
          x < rect.right &&
          rect.left < x + size.width &&
          y < rect.bottom &&
          rect.top < y + size.height
      )
      if (!blocker) return { x, y }
      // Skip past the table in the way instead of stepping across it
      x = Math.max(x + PLACEMENT_STEP, blocker.right)
    }
  }
  return null
}

/**
 * A table position kept inside the canvas for the table's size. Used for every
 * move or resize, so a dragged or enlarged table never spills off the edge.
 */
export const fitOnCanvas = (
  position: { positionX: number; positionY: number },
  shape: SeatingTableShape,
  capacity: number
): { positionX: number; positionY: number } => {
  const { x, y } = clampTablePosition(
    { x: position.positionX, y: position.positionY },
    getTableFootprint(shape, capacity)
  )
  return { positionX: x, positionY: y }
}

/**
 * The position to save after an edit changes a table's size, or undefined when
 * it still fits. Edits then never resend a position, so they cannot undo a
 * move another planner made in the meantime.
 */
export const refitAfterResize = (
  table: { positionX: number; positionY: number },
  shape: SeatingTableShape,
  capacity: number
): { positionX: number; positionY: number } | undefined => {
  const fitted = fitOnCanvas(table, shape, capacity)
  const moved = fitted.positionX !== table.positionX || fitted.positionY !== table.positionY
  return moved ? fitted : undefined
}
