import {
  getSeatsNeeded,
  hasRoomForGuests,
  isSeatableRsvp,
} from '~/server/domains/seating/seating.rules'

describe('seating rules', () => {
  describe('isSeatableRsvp', () => {
    it.each([
      ['Invited', true],
      ['Attending', true],
      ['Declined', false],
      ['Not Invited', false],
    ])('treats %s as seatable=%s', (rsvp, expected) => {
      expect(isSeatableRsvp(rsvp)).toBe(expected)
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
