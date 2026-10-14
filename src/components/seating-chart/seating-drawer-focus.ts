import { findNearest } from '~/components/seating-chart/seating-focus'

type DrawerFocusInput = {
  // Focus key of the element that opened the drawer
  openerKey: string
  // Sidebar focus keys in DOM order when the drawer opened
  sidebarKeysAtOpen: readonly string[]
  guestId: number
  isPresent: (key: string) => boolean
}

/**
 * Where focus goes when the guest drawer closes: back to the element that
 * opened it, or, when seating or unseating from the drawer removed that
 * element, the nearest surviving place. Null means nowhere is left.
 */
export const pickFocusAfterDrawerClose = ({
  openerKey,
  sidebarKeysAtOpen,
  guestId,
  isPresent,
}: DrawerFocusInput): string | null => {
  if (isPresent(openerKey)) return openerKey

  // Opened from the sidebar: continue with the next guest still waiting
  const index = sidebarKeysAtOpen.indexOf(openerKey)
  const next = index === -1 ? undefined : findNearest(sidebarKeysAtOpen, index, isPresent)
  if (next) return next

  // Otherwise follow the guest to wherever they are now
  return [`sidebar-guest:${guestId}`, `seat-guest:${guestId}`].find(isPresent) ?? null
}
