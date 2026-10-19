import {
  assignGuestsSchema,
  createSeatingTableSchema,
  seatingEventIdSchema,
} from '~/server/domains/seating/seating.validator'

describe('seating validators', () => {
  it('accepts non-uuid event ids used by seeded and imported data', () => {
    expect(seatingEventIdSchema.safeParse({ eventId: 'event-seed-ceremony' }).success).toBe(true)
  })

  it('rejects an empty event id', () => {
    expect(seatingEventIdSchema.safeParse({ eventId: '' }).success).toBe(false)
  })

  it.each([0, 31, 2.5])('rejects a capacity of %s', (capacity) => {
    const result = createSeatingTableSchema.safeParse({
      eventId: 'event-1',
      name: 'Table 1',
      shape: 'ROUND',
      capacity,
      positionX: 0,
      positionY: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects an unknown table shape', () => {
    const result = createSeatingTableSchema.safeParse({
      eventId: 'event-1',
      name: 'Table 1',
      shape: 'SQUARE',
      capacity: 8,
      positionX: 0,
      positionY: 0,
    })
    expect(result.success).toBe(false)
  })

  it('requires at least one guest to assign', () => {
    expect(assignGuestsSchema.safeParse({ tableId: 't1', guestIds: [] }).success).toBe(false)
  })
})
