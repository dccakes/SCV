import type { WeddingPageData } from '~/server/domains/website/website.types'

type PageEvent = WeddingPageData['events'][number]

/**
 * The main "Wedding Day" event. Uses the server's `isWeddingDay` flag, since the
 * event name may be translated for Spanish visitors, and falls back to the
 * English name for data that predates the flag.
 */
export function findWeddingDay<T extends Pick<PageEvent, 'name' | 'isWeddingDay'>>(
  events: readonly T[]
): T | undefined {
  return events.find((event) => event.isWeddingDay ?? event.name === 'Wedding Day')
}
