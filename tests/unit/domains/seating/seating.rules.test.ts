import {
  getOpenSeats,
  getSeatsNeeded,
  hasRoomForGuests,
  NON_SEATABLE_RSVPS,
  openSeatsMessage,
  tableHasRoom,
} from '~/server/domains/seating/seating.rules'

describe('seating rules', () => {
  it('excludes declined and not-invited guests from seating', () => {
    expect(NON_SEATABLE_RSVPS).toEqual(['Declined', 'Not Invited'])
  })

  describe('table helpers', () => {
    it('counts open seats, never below zero', () => {
      expect(getOpenSeats({ capacity: 4, guestIds: [1] })).toBe(3)
      expect(getOpenSeats({ capacity: 2, guestIds: [1, 2, 3] })).toBe(0)
    })

    it('checks room on a chart table', () => {
      expect(tableHasRoom({ capacity: 2, guestIds: [1] }, [2])).toBe(true)
      expect(tableHasRoom({ capacity: 2, guestIds: [1] }, [2, 3])).toBe(false)
    })

    it('pluralises the open seats message', () => {
      expect(openSeatsMessage('Table 1', 1)).toBe('Table 1 only has 1 open seat')
      expect(openSeatsMessage('Table 1', 0)).toBe('Table 1 only has 0 open seats')
    })
  })

  describe('getSeatsNeeded', () => {
    it('counts only guests not already at the table', () => {
      expect(getSeatsNeeded([1, 2], [2, 3, 4])).toBe(2)
    })

    it('ignores duplicate incoming ids', () => {
      expect(getSeatsNeeded([], [5, 5, 6])).toBe(2)
    })
  })

  describe('hasRoomForGuests', () => {
    it('allows filling a table exactly to capacity', () => {
      expect(hasRoomForGuests({ capacity: 4, seatedGuestIds: [1, 2] }, [3, 4])).toBe(true)
    })

    it('rejects a drop that would exceed capacity', () => {
      expect(hasRoomForGuests({ capacity: 4, seatedGuestIds: [1, 2, 3] }, [4, 5])).toBe(false)
    })

    it('allows re-dropping guests who are already seated at the table', () => {
      expect(hasRoomForGuests({ capacity: 2, seatedGuestIds: [1, 2] }, [1, 2])).toBe(true)
    })
  })
})
