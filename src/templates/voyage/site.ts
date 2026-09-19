import type { WeddingPageData } from '~/server/domains/website/website.types'
import type {
  WebsiteSection,
  WebsiteSectionType,
} from '~/server/domains/website-section/website-section.types'

/** Shared by routes and navigation. English copy is kept here for future localization. */
export const voyagePages = {
  weekend: {
    title: 'Wedding Weekend',
    description: 'The moments we can’t wait to share with you.',
  },
  stay: {
    title: 'Where to Stay',
    description: 'Find your home for the weekend, with booking details close at hand.',
  },
  travel: {
    title: 'Travel',
    description: 'Everything you need for the journey and your time here.',
  },
  puebla: {
    title: 'Explore Puebla',
    description: 'A little local inspiration for the time between celebrations.',
  },
  mexico: { title: 'Explore Mexico', description: 'Make a longer adventure of your journey.' },
  story: {
    title: 'Our Story',
    description: 'The people, places and moments that brought us here.',
  },
  faq: {
    title: 'FAQs & Contact',
    description: 'A few useful answers, and a way to stay in touch.',
  },
  registry: { title: 'Registry', description: 'Your presence means the world to us.' },
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
export function eventDate(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}
export function eventDateRange(events: VoyageEvent[]) {
  const dates = orderedEvents(events).flatMap((event) => (event.date ? [event.date] : []))
  const first = dates[0]
  const last = dates[dates.length - 1]
  if (!first || !last) return null
  return first.getTime() === last.getTime()
    ? eventDate(first)
    : `${eventDate(first)} – ${eventDate(last)}`
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
export function coupleIdentity(wedding: WeddingPageData) {
  const names = [wedding.brideFirstName, wedding.groomFirstName].filter(
    (name): name is string => !!name
  )
  return {
    coupleNames: names.join(' & ') || 'Our Wedding',
    contactNames: names.join(' or ') || 'the couple',
    monogram: names.map((name) => name[0]).join(' | ') || 'Our Wedding',
  }
}
/** Keep previously shared in-page links working. */
export const legacyVoyageAnchors: Record<string, string> = {
  'our-story': 'story',
  timeline: 'story#timeline',
  destination: 'weekend#destination',
  'wedding-weekend': 'weekend',
  'wedding-party': 'story#wedding-party',
  moments: 'story#moments',
  travel: 'travel',
  faq: 'faq',
  flights: 'travel#flights',
  zocalo: 'puebla',
  'explore-mexico': 'mexico',
  registry: 'registry',
}
