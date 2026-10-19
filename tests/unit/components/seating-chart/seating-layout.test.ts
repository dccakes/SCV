import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  clampTablePosition,
  fitOnCanvas,
  getNextTablePosition,
  getSeatPositions,
  getTableFootprint,
  refitAfterResize,
} from '~/components/seating-chart/seating-layout'

describe('seating layout', () => {
  it.each([
    ['ROUND', 8],
    ['ROUND', 1],
    ['RECTANGULAR', 10],
    ['RECTANGULAR', 3],
  ] as const)('places one seat per guest for a %s table of %i', (shape, capacity) => {
    const seats = getSeatPositions(shape, capacity)
    const footprint = getTableFootprint(shape, capacity)

    expect(seats).toHaveLength(capacity)
    for (const seat of seats) {
      expect(seat.x).toBeGreaterThanOrEqual(0)
      expect(seat.y).toBeGreaterThanOrEqual(0)
      expect(seat.x).toBeLessThanOrEqual(footprint.width)
      expect(seat.y).toBeLessThanOrEqual(footprint.height)
    }
  })

  it('grows round tables as capacity increases', () => {
    expect(getTableFootprint('ROUND', 16).width).toBeGreaterThan(
      getTableFootprint('ROUND', 8).width
    )
  })

  it('splits rectangular seats across the two long sides', () => {
    const seats = getSeatPositions('RECTANGULAR', 6)
    const ys = new Set(seats.map((seat) => seat.y))
    expect(ys.size).toBe(2)
  })

  it('keeps tables inside the canvas', () => {
    const footprint = getTableFootprint('ROUND', 8)
    expect(clampTablePosition({ x: -50, y: -10 }, footprint)).toEqual({ x: 0, y: 0 })
    expect(clampTablePosition({ x: 99_999, y: 99_999 }, footprint)).toEqual({
      x: CANVAS_WIDTH - footprint.width,
      y: CANVAS_HEIGHT - footprint.height,
    })
  })

  it('places the first table at the canvas margin', () => {
    expect(getNextTablePosition([], { shape: 'ROUND', capacity: 8 })).toEqual({ x: 40, y: 40 })
  })
})

type Placed = {
  positionX: number
  positionY: number
  shape: 'ROUND' | 'RECTANGULAR'
  capacity: number
}

const overlaps = (a: Placed, b: Placed) => {
  const fa = getTableFootprint(a.shape, a.capacity)
  const fb = getTableFootprint(b.shape, b.capacity)
  return (
    a.positionX < b.positionX + fb.width &&
    b.positionX < a.positionX + fa.width &&
    a.positionY < b.positionY + fb.height &&
    b.positionY < a.positionY + fa.height
  )
}

const placeAll = (shape: Placed['shape'], capacity: number, max = 500) => {
  const placed: Placed[] = []
  for (let i = 0; i < max; i++) {
    const point = getNextTablePosition(placed, { shape, capacity })
    if (!point) break
    placed.push({ positionX: point.x, positionY: point.y, shape, capacity })
  }
  return placed
}

describe('getNextTablePosition', () => {
  it('does not overlap two large rectangular tables', () => {
    const placed = placeAll('RECTANGULAR', 30, 2)
    const [first, second] = placed
    if (!first || !second) throw new Error('expected two tables to be placed')
    expect(overlaps(first, second)).toBe(false)
  })

  it.each([
    ['ROUND', 8],
    ['RECTANGULAR', 30],
    ['ROUND', 30],
  ] as const)('fills the canvas with %s %i-seat tables without overlap, then reports no room', (shape, capacity) => {
    const placed = placeAll(shape, capacity)
    const footprint = getTableFootprint(shape, capacity)

    // Filling stopped because space ran out, not because of the loop cap
    expect(placed.length).toBeGreaterThan(1)
    expect(placed.length).toBeLessThan(500)
    expect(getNextTablePosition(placed, { shape, capacity })).toBeNull()
    for (const [index, a] of placed.entries()) {
      expect(a.positionX).toBeGreaterThanOrEqual(0)
      expect(a.positionY).toBeGreaterThanOrEqual(0)
      expect(a.positionX + footprint.width).toBeLessThanOrEqual(CANVAS_WIDTH)
      expect(a.positionY + footprint.height).toBeLessThanOrEqual(CANVAS_HEIGHT)
      for (const b of placed.slice(index + 1)) expect(overlaps(a, b)).toBe(false)
    }
  })

  it('works around tables the planner has already moved', () => {
    const existing: Placed[] = [
      { positionX: 40, positionY: 40, shape: 'RECTANGULAR', capacity: 30 },
      { positionX: 700, positionY: 60, shape: 'ROUND', capacity: 12 },
    ]
    const point = getNextTablePosition(existing, { shape: 'ROUND', capacity: 10 })
    expect(point).not.toBeNull()
    const candidate: Placed = {
      positionX: point?.x ?? 0,
      positionY: point?.y ?? 0,
      shape: 'ROUND',
      capacity: 10,
    }
    for (const table of existing) expect(overlaps(candidate, table)).toBe(false)
  })
})

describe('fitOnCanvas', () => {
  it('pulls a table back inside the canvas when it grows past the edge', () => {
    const big = getTableFootprint('ROUND', 30)
    expect(fitOnCanvas({ positionX: 2200, positionY: 40 }, 'ROUND', 30)).toEqual({
      positionX: CANVAS_WIDTH - big.width,
      positionY: 40,
    })
  })

  it('keeps a position that already fits, rounded to whole pixels', () => {
    expect(fitOnCanvas({ positionX: 40.4, positionY: 40 }, 'ROUND', 8)).toEqual({
      positionX: 40,
      positionY: 40,
    })
  })

  it('keeps a dragged table off negative coordinates', () => {
    expect(fitOnCanvas({ positionX: -30, positionY: -5 }, 'RECTANGULAR', 6)).toEqual({
      positionX: 0,
      positionY: 0,
    })
  })
})

describe('refitAfterResize', () => {
  it('returns a new position only when the resized table no longer fits', () => {
    expect(refitAfterResize({ positionX: 2200, positionY: 40 }, 'ROUND', 30)).toEqual(
      fitOnCanvas({ positionX: 2200, positionY: 40 }, 'ROUND', 30)
    )
  })

  it('returns nothing when the position is unchanged, so edits never resend it', () => {
    expect(refitAfterResize({ positionX: 40, positionY: 40 }, 'ROUND', 8)).toBeUndefined()
  })
})
