export type FocusCandidate = { key: string; guestIds: readonly number[] }

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

  const next = candidates.slice(index + 1).find(remains)
  if (next) return next.key
  const previous = candidates.slice(0, index).reverse().find(remains)
  return previous?.key ?? null
}
