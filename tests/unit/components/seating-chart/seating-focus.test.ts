import { findNearest, getNextFocusKey } from '~/components/seating-chart/seating-focus'

// Sidebar order: Smith household header, Ann, Ben, then Jones header, Cara
const candidates = [
  { key: 'household:h1', guestIds: [1, 2] },
  { key: 'sidebar-guest:1', guestIds: [1] },
  { key: 'sidebar-guest:2', guestIds: [2] },
  { key: 'household:h2', guestIds: [3] },
  { key: 'sidebar-guest:3', guestIds: [3] },
]

describe('getNextFocusKey', () => {
  it('moves to the next guest after seating one guest', () => {
    expect(getNextFocusKey(candidates, 'sidebar-guest:1', [1])).toBe('sidebar-guest:2')
  })

  it('skips everything removed when a whole household is seated', () => {
    expect(getNextFocusKey(candidates, 'household:h1', [1, 2])).toBe('household:h2')
  })

  it('keeps a household header that still has unseated members', () => {
    expect(getNextFocusKey(candidates, 'sidebar-guest:2', [2])).toBe('household:h2')
    expect(getNextFocusKey(candidates, 'sidebar-guest:1', [1, 3])).toBe('sidebar-guest:2')
  })

  it('falls back to the previous remaining item at the end of the list', () => {
    expect(getNextFocusKey(candidates, 'sidebar-guest:3', [3])).toBe('sidebar-guest:2')
  })

  it('returns null when nobody is left to seat', () => {
    expect(getNextFocusKey(candidates, 'household:h1', [1, 2, 3])).toBeNull()
  })

  it('returns null when the dragged item is not in the list', () => {
    expect(getNextFocusKey(candidates, 'seat-guest:9', [9])).toBeNull()
  })
})

describe('findNearest', () => {
  const items = ['a', 'b', 'c', 'd']

  it('prefers the next kept item after the index', () => {
    expect(findNearest(items, 1, (item) => item !== 'c')).toBe('d')
  })

  it('falls back to the previous kept item', () => {
    expect(findNearest(items, 3, (item) => item !== 'c')).toBe('b')
  })

  it('returns undefined when nothing is kept', () => {
    expect(findNearest(items, 0, () => false)).toBeUndefined()
  })
})
