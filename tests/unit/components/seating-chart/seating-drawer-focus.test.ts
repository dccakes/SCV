import { pickFocusAfterDrawerClose } from '~/components/seating-chart/seating-drawer-focus'

const sidebarKeys = ['household:h1', 'sidebar-guest:1', 'sidebar-guest:2', 'sidebar-guest:3']

describe('pickFocusAfterDrawerClose', () => {
  it('returns to the element that opened the drawer when it still exists', () => {
    expect(
      pickFocusAfterDrawerClose({
        openerKey: 'sidebar-guest:1',
        sidebarKeysAtOpen: sidebarKeys,
        guestId: 1,
        isPresent: () => true,
      })
    ).toBe('sidebar-guest:1')
  })

  it('moves to the next unseated guest after seating one from the sidebar', () => {
    const present = new Set(['household:h1', 'sidebar-guest:2', 'sidebar-guest:3', 'seat-guest:1'])
    expect(
      pickFocusAfterDrawerClose({
        openerKey: 'sidebar-guest:1',
        sidebarKeysAtOpen: sidebarKeys,
        guestId: 1,
        isPresent: (key) => present.has(key),
      })
    ).toBe('sidebar-guest:2')
  })

  it('falls back to an earlier sidebar item when the last one was seated', () => {
    const present = new Set(['household:h1', 'sidebar-guest:1', 'sidebar-guest:2'])
    expect(
      pickFocusAfterDrawerClose({
        openerKey: 'sidebar-guest:3',
        sidebarKeysAtOpen: sidebarKeys,
        guestId: 3,
        isPresent: (key) => present.has(key),
      })
    ).toBe('sidebar-guest:2')
  })

  it('follows a guest unseated from the floor plan to the sidebar', () => {
    const present = new Set([...sidebarKeys, 'sidebar-guest:9'])
    expect(
      pickFocusAfterDrawerClose({
        openerKey: 'seat-guest:9',
        sidebarKeysAtOpen: sidebarKeys,
        guestId: 9,
        isPresent: (key) => present.has(key),
      })
    ).toBe('sidebar-guest:9')
  })

  it('follows a guest to their seat when nothing is left in the sidebar', () => {
    expect(
      pickFocusAfterDrawerClose({
        openerKey: 'sidebar-guest:1',
        sidebarKeysAtOpen: ['sidebar-guest:1'],
        guestId: 1,
        isPresent: (key) => key === 'seat-guest:1',
      })
    ).toBe('seat-guest:1')
  })

  it('returns null when nothing else exists, so the caller falls back', () => {
    expect(
      pickFocusAfterDrawerClose({
        openerKey: 'sidebar-guest:1',
        sidebarKeysAtOpen: ['sidebar-guest:1'],
        guestId: 1,
        isPresent: () => false,
      })
    ).toBeNull()
  })
})
