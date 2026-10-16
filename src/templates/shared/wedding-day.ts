import { WEDDING_DAY_EVENT_NAME } from '~/server/domains/event/event.types'
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
  return events.find((event) => event.isWeddingDay ?? event.name === WEDDING_DAY_EVENT_NAME)
}
