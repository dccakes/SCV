import type { WeddingPageData } from '~/server/domains/website/website.types'

type PageEvent = WeddingPageData['events'][number]

/**
 * The main "Wedding Day" event. Uses the server's `isWeddingDay` flag, since the
 * event name may be translated for Spanish visitors.
 */
export function findWeddingDay<T extends Pick<PageEvent, 'isWeddingDay'>>(
  events: readonly T[]
): T | undefined {
  return events.find((event) => event.isWeddingDay)
}
