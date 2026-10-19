export type FocusCandidate = { key: string; guestIds: readonly number[] }

/**
 * Nearest item to `index` that passes `keep`: the next one first, then the
 * previous. Shared ordering rule for every "where does focus go now" choice.
 */
export const findNearest = <T>(
  items: readonly T[],
  index: number,
  keep: (item: T) => boolean
): T | undefined => items.slice(index + 1).find(keep) ?? items.slice(0, index).reverse().find(keep)

/**
 * After guests are seated from the sidebar, the item that was dragged leaves
 * the list. Pick the nearest item that will still be there (next first, then
 * previous) so a keyboard user can keep seating without losing their place.
 */
export const getNextFocusKey = (
  candidates: readonly FocusCandidate[],
  activeKey: string,
  movingGuestIds: readonly number[]
): string | null => {
  const index = candidates.findIndex((candidate) => candidate.key === activeKey)
  if (index === -1) return null

  const moving = new Set(movingGuestIds)
  const remains = (candidate: FocusCandidate) => candidate.guestIds.some((id) => !moving.has(id))

  return findNearest(candidates, index, remains)?.key ?? null
}
