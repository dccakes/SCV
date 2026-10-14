import type { WeddingPageData } from '~/server/domains/website/website.types'
import type {
  WebsiteSection,
  WebsiteSectionType,
} from '~/server/domains/website-section/website-section.types'

/**
 * Shared by routes and navigation. Copy lives in the `voyage.pages` messages;
 * each entry names its title and description keys.
 */
export const voyagePages = {
  weekend: { titleKey: 'weekend.title', descriptionKey: 'weekend.description' },
  stay: { titleKey: 'stay.title', descriptionKey: 'stay.description' },
  travel: { titleKey: 'travel.title', descriptionKey: 'travel.description' },
  puebla: { titleKey: 'puebla.title', descriptionKey: 'puebla.description' },
  mexico: { titleKey: 'mexico.title', descriptionKey: 'mexico.description' },
  story: { titleKey: 'story.title', descriptionKey: 'story.description' },
  faq: { titleKey: 'faq.title', descriptionKey: 'faq.description' },
  registry: { titleKey: 'registry.title', descriptionKey: 'registry.description' },
} as const
export type VoyagePage = keyof typeof voyagePages
export type VoyageLocation = VoyagePage | 'home' | 'rsvp'
export const primaryPages: VoyagePage[] = ['weekend', 'stay', 'travel']
export const explorePages: VoyagePage[] = ['puebla', 'mexico']
export const secondaryPages: VoyagePage[] = ['story', 'faq', 'registry']

export function isVoyagePage(page: string): page is VoyagePage {
  return Object.hasOwn(voyagePages, page)
}
export function sectionOf<T extends WebsiteSectionType>(sections: WebsiteSection[], type: T) {
  return sections.find(
    (section): section is Extract<WebsiteSection, { type: T }> => section.type === type
  )
}
export type VoyageEvent = WeddingPageData['events'][number]
export function orderedEvents(events: VoyageEvent[]) {
  return [...events].sort((a, b) => {
    const order = (a.date?.getTime() ?? Infinity) - (b.date?.getTime() ?? Infinity)
    return (
      (Number.isNaN(order) ? 0 : order) ||
      (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99')
    )
  })
}
/** Database calendar dates must not shift into the server's timezone. */
export function eventDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}
export function eventDateRange(events: VoyageEvent[], locale: string) {
  const dates = orderedEvents(events).flatMap((event) => (event.date ? [event.date] : []))
  const first = dates[0]
  const last = dates[dates.length - 1]
  if (!first || !last) return null
  return first.getTime() === last.getTime()
    ? eventDate(first, locale)
    : `${eventDate(first, locale)} – ${eventDate(last, locale)}`
}
export function flightDates(events: VoyageEvent[]) {
  const dates = orderedEvents(events).flatMap((event) => (event.date ? [event.date] : []))
  const shift = (date: Date | undefined, days: number) => {
    if (!date) return null
    const copy = new Date(date)
    copy.setUTCDate(copy.getUTCDate() + days)
    return copy.toISOString().slice(0, 10)
  }
  return {
    departPlaceholder: shift(dates[0], -1),
    returnPlaceholder: shift(dates[dates.length - 1], 1),
  }
}
/** Fallback wording for `coupleIdentity`, from the `voyage.identity` messages. */
export type IdentityCopy = { ourWedding: string; theCouple: string; or: string }
export function identityCopy(t: (key: keyof IdentityCopy) => string): IdentityCopy {
  return { ourWedding: t('ourWedding'), theCouple: t('theCouple'), or: t('or') }
}
export function coupleIdentity(wedding: WeddingPageData, copy: IdentityCopy) {
  const names = [wedding.brideFirstName, wedding.groomFirstName].filter(
    (name): name is string => !!name
  )
  return {
    coupleNames: names.join(' & ') || copy.ourWedding,
    contactNames: names.join(` ${copy.or} `) || copy.theCouple,
    monogram: names.map((name) => name[0]).join(' | ') || copy.ourWedding,
  }
}
/** Keep previously shared in-page links working. */
export const legacyVoyageAnchors: Record<string, string> = {
  'our-story': 'story',
  timeline: 'story#timeline',
  'wedding-weekend': 'weekend',
  'wedding-party': 'story#wedding-party',
  moments: 'story#moments',
  travel: 'travel',
  faq: 'faq',
  zocalo: 'puebla',
  'explore-mexico': 'mexico',
}
