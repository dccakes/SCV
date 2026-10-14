import type { SeatingTableShape } from '~/server/domains/seating/seating.types'

export const CANVAS_WIDTH = 2400
export const CANVAS_HEIGHT = 1600
export const SEAT_SIZE = 30

const SEAT_GAP = 6
const SEAT_PITCH = SEAT_SIZE + SEAT_GAP
const MIN_ROUND_DIAMETER = 84
const RECT_TABLE_DEPTH = 64
const MIN_RECT_LENGTH = 96
const GRID_STEP = 280
const GRID_MARGIN = 40

export type Point = { x: number; y: number }
export type Footprint = { width: number; height: number }

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
 * First grid slot not already occupied by a table's top-left corner.
 */
export const getNextTablePosition = (
  tables: ReadonlyArray<{ positionX: number; positionY: number }>
): Point => {
  const columns = Math.floor((CANVAS_WIDTH - GRID_MARGIN) / GRID_STEP)
  const isTaken = (point: Point) =>
    tables.some(
      (table) =>
        Math.abs(table.positionX - point.x) < GRID_STEP / 2 &&
        Math.abs(table.positionY - point.y) < GRID_STEP / 2
    )

  for (let index = 0; ; index++) {
    const point = {
      x: GRID_MARGIN + (index % columns) * GRID_STEP,
      y: GRID_MARGIN + Math.floor(index / columns) * GRID_STEP,
    }
    if (!isTaken(point) || point.y > CANVAS_HEIGHT - GRID_STEP) return point
  }
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
