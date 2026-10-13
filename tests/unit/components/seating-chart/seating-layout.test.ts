import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  clampTablePosition,
  getNextTablePosition,
  getSeatPositions,
  getTableFootprint,
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

  it('places new tables on the first free grid slot', () => {
    const first = getNextTablePosition([])
    const second = getNextTablePosition([{ positionX: first.x, positionY: first.y }])
    expect(second).not.toEqual(first)
  })
})
