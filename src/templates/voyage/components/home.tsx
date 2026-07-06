/**
 * VoyageHome
 *
 * The long-scroll luxury destination-wedding landing page. It composes a
 * cinematic hero (with the nav overlaid and a light "Let's Celebrate" card),
 * then lays out the enabled content sections in a bespoke editorial order —
 * About Us, the story timeline, the destination feature, the weekend itinerary,
 * our people, a favourite-moments fotowall, travel & questions and flights —
 * and closes on a combined registry / RSVP invitation and a dark footer.
 *
 * Every image is optional; each block degrades to an elegant typographic or
 * line-illustrated state when a photo is absent. The single responsive layout
 * serves both desktop and mobile.
 */

import { formatDateHTML5 } from '~/app/utils/helpers'
import type { WeddingPageData } from '~/server/domains/website/website.types'
import type {
  WebsiteSection,
  WebsiteSectionType,
} from '~/server/domains/website-section/website-section.types'
import type { TemplateSurfaceProps } from '~/templates/types'
import { Decor } from '~/templates/voyage/components/decor'
import { VoyageFlightSearch } from '~/templates/voyage/components/flight-search'
import {
  HeroBackground,
  type VoyageMoment,
  VoyageMoments,
} from '~/templates/voyage/components/media'
import { VoyageNavbar, type VoyageNavItem } from '~/templates/voyage/components/navbar'
import {
  bodyFont,
  Eyebrow,
  FloralCorner,
  FloralSpray,
  GhostButtonOnDark,
  GoldRule,
  HaciendaSketch,
  HeartRule,
  headingFont,
  IconCoffee,
  IconDinner,
  IconGlass,
  IconHeart,
  IconRings,
  IconSparkle,
  labelFont,
  PrimaryButton,
  scriptFont,
  sectionHeadingClass,
} from '~/templates/voyage/components/primitives'
import {
  VoyageDestination,
  VoyageOurStory,
  VoyageRegistry,
  VoyageTimeline,
  VoyageTravelFaq,
  VoyageWeddingParty,
} from '~/templates/voyage/components/sections'

type Section = WebsiteSection
type WeddingEvent = WeddingPageData['events'][number]

/** Narrow the section list to a single typed section by its discriminant. */
function pick<T extends WebsiteSectionType>(
  sections: Section[],
  type: T
): Extract<Section, { type: T }> | undefined {
  return sections.find((section): section is Extract<Section, { type: T }> => section.type === type)
}

const WEEKEND_ICONS = [IconGlass, IconRings, IconGlass, IconDinner, IconSparkle, IconCoffee]

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

const WEEKDAY_FORMAT = new Intl.DateTimeFormat('en-US', { weekday: 'long' })

/** Day-of-week ("Saturday") when the event has a date, else null. */
function eventDayLabel(event: WeddingEvent): string | null {
  return event.date ? WEEKDAY_FORMAT.format(event.date) : null
}

/** Calendar order: dated events first (by date, then start time), undated events last. */
function compareEvents(a: WeddingEvent, b: WeddingEvent): number {
  const aTime = a.date ? a.date.getTime() : Number.POSITIVE_INFINITY
  const bTime = b.date ? b.date.getTime() : Number.POSITIVE_INFINITY
  if (aTime !== bTime) {
    return aTime - bTime
  }
  return (a.startTime ?? '').localeCompare(b.startTime ?? '')
}

function WeekendItinerary({ events }: { events: WeddingEvent[] }) {
  if (events.length === 0) {
    return null
  }
  const items = [...events].sort(compareEvents).slice(0, 6)
  return (
    <section
      id='wedding-weekend'
      className='relative w-full scroll-mt-24 overflow-hidden bg-[#F7F3EC] px-6 py-20 sm:py-24 lg:px-10'
    >
      <Decor
        name='floralSpray2'
        className='pointer-events-none absolute top-1/2 -left-10 hidden h-[22rem] w-auto -translate-y-1/2 -scale-x-100 lg:block'
        fallback={
          <FloralCorner className='pointer-events-none absolute top-8 left-3 hidden h-24 w-auto -scale-x-100 opacity-70 lg:block' />
        }
      />
      <Decor
        name='floralSpray2'
        className='pointer-events-none absolute top-1/2 -right-10 hidden h-[22rem] w-auto -translate-y-1/2 lg:block'
        fallback={
          <FloralCorner className='pointer-events-none absolute right-3 bottom-8 hidden h-24 w-auto -scale-y-100 opacity-70 lg:block' />
        }
      />
      <div className='relative mx-auto max-w-6xl'>
        <div className='mb-14 flex flex-col items-center gap-4 text-center'>
          <Eyebrow>Wedding Weekend</Eyebrow>
          <h2 className={`${scriptFont} text-5xl text-[#B15C41] sm:text-6xl`}>
            Let&rsquo;s Celebrate Together
          </h2>
        </div>
        <ol className='relative flex flex-wrap justify-center gap-x-10 gap-y-12 lg:flex-nowrap lg:justify-center lg:gap-x-0 lg:divide-x lg:divide-[#DDD2C0]/80'>
          {items.map((event, index) => {
            const Icon = WEEKEND_ICONS[index % WEEKEND_ICONS.length] ?? IconGlass
            const day = eventDayLabel(event)
            return (
              <li
                key={event.id}
                className='relative flex w-32 flex-col items-center gap-2 text-center sm:w-40 lg:w-auto lg:flex-1 lg:px-3'
              >
                <span className='flex h-14 w-14 items-center justify-center bg-[#F7F3EC] text-[#8A7A66] ring-4 ring-[#F7F3EC]'>
                  <Icon className='h-9 w-9' />
                </span>
                {day ? (
                  <span
                    className={`${labelFont} mt-1 text-[#B15C41] text-[0.58rem] uppercase tracking-[0.24em]`}
                  >
                    {day}
                  </span>
                ) : null}
                <span
                  className={`${labelFont} font-semibold text-[#1D2320] text-[0.74rem] uppercase tracking-[0.2em]`}
                >
                  {event.name}
                </span>
                {event.startTime ? (
                  <span
                    className={`${labelFont} text-[#6F675D] text-[0.62rem] uppercase tracking-[0.2em]`}
                  >
                    {event.startTime}
                  </span>
                ) : null}
                {event.description ? (
                  <p className={`${bodyFont} mt-1 max-w-[15rem] text-[#6F675D] text-sm leading-6`}>
                    {event.description}
                  </p>
                ) : null}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

/** The light "Let's Celebrate" card that floats over the hero photograph. Hidden for now — see its call site below. */
// biome-ignore lint/correctness/noUnusedVariables: kept for when the hero card is re-enabled
function HeroCelebrationCard({
  dateLabel,
  location,
  venue,
}: {
  dateLabel: string | null
  location: string | null
  venue: string | null
}) {
  if (!dateLabel && !location && !venue) {
    return null
  }
  return (
    <div className='lg:col-span-5 lg:justify-self-end'>
      <div className='mx-auto max-w-sm rounded-[3px] border border-[#DDD2C0] bg-[#FBF8F2]/95 px-8 py-9 text-center shadow-[0_18px_50px_-25px_rgba(13,17,15,0.55)] backdrop-blur-sm'>
        <p className={`${scriptFont} text-3xl text-[#B15C41]`}>Let&rsquo;s Celebrate</p>
        {dateLabel ? (
          <p className={`${headingFont} mt-4 text-2xl text-[#1D2320] uppercase tracking-[0.14em]`}>
            {dateLabel}
          </p>
        ) : null}
        {location ? (
          <p
            className={`${labelFont} mt-2 text-[#6F675D] text-[0.62rem] uppercase tracking-[0.28em]`}
          >
            {location}
          </p>
        ) : null}
        <HeartRule className='mt-5' />
        <Decor
          name='churchSeal'
          className='mx-auto mt-5 h-28 w-auto object-contain'
          fallback={<HaciendaSketch className='mx-auto mt-5 h-14 w-auto text-[#7C7264]/80' />}
        />
        {venue ? (
          <p
            className={`${labelFont} mt-4 text-[#1D2320] text-[0.6rem] uppercase tracking-[0.26em]`}
          >
            {venue}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function VoyageHome({ weddingData, path, introText }: Readonly<TemplateSurfaceProps>) {
  const { website } = weddingData
  const bride = weddingData.brideFirstName ?? ''
  const groom = weddingData.groomFirstName ?? ''
  const monogram = `${bride?.[0] ?? 'B'} | ${groom?.[0] ?? 'G'}`.toUpperCase()
  const coupleNames = [bride, groom].filter(Boolean).join(' & ') || 'Our Wedding'

  const heroUrl = website.headerImageUrl ?? website.coverPhotoUrl ?? null
  const dateLabel = weddingData.date?.standardFormat ?? null
  const heroHeadline = website.headline?.trim() ? website.headline.trim() : null
  const heroHeadlineAccent = website.headlineAccent?.trim() ? website.headlineAccent.trim() : null

  const story = pick(weddingData.sections, 'TIMELINE')
  const ourStory = pick(weddingData.sections, 'OUR_STORY')
  const destination = pick(weddingData.sections, 'DESTINATION')
  const experiences = pick(weddingData.sections, 'EXPERIENCES')
  const weddingParty = pick(weddingData.sections, 'WEDDING_PARTY')
  const travel = pick(weddingData.sections, 'TRAVEL')
  const faq = pick(weddingData.sections, 'FAQ')
  const registry = pick(weddingData.sections, 'REGISTRY')

  const weddingEvent =
    weddingData.events.find((event) => event.name === 'Wedding Day') ?? weddingData.events[0]
  const location = destination?.content.location ?? null
  // biome-ignore lint/correctness/noUnusedVariables: kept for the hero card, which is hidden for now
  const venue = destination?.content.venueName ?? weddingEvent?.venue ?? null

  const galleryUrls = website.coupleImageUrls ?? []
  const aboutImageUrl = galleryUrls[0] ?? null

  // Favourite-moments fotowall: prefer captioned experiences, else the gallery.
  const moments: VoyageMoment[] = experiences?.content.items.some((item) => item.imageUrl)
    ? experiences.content.items
        .filter((item) => item.imageUrl)
        .map((item) => ({
          imageUrl: item.imageUrl as string,
          title: item.title,
          description: item.description,
        }))
    : galleryUrls.map((url) => ({ imageUrl: url }))

  const eventDates = weddingData.events
    .map((event) => event.date)
    .filter((date): date is Date => date !== null)
    .sort((a, b) => a.getTime() - b.getTime())
  const firstEventDate = eventDates[0] ?? null
  const lastEventDate = eventDates[eventDates.length - 1] ?? null
  const flightDepartPlaceholder = firstEventDate
    ? (formatDateHTML5(addDays(firstEventDate, -1)) ?? null)
    : null
  const flightReturnPlaceholder = lastEventDate
    ? (formatDateHTML5(addDays(lastEventDate, 1)) ?? null)
    : null

  // Build the in-page nav from what actually exists, in editorial order.
  const navItems: VoyageNavItem[] = []
  if (ourStory) navItems.push({ label: 'About Us', href: '#our-story' })
  if (story) navItems.push({ label: 'Our Story', href: '#timeline' })
  if (weddingData.events.length > 0)
    navItems.push({ label: 'Wedding Weekend', href: '#wedding-weekend' })
  if (destination) navItems.push({ label: 'The Destination', href: '#destination' })
  if (weddingParty) navItems.push({ label: 'Wedding Party', href: '#wedding-party' })
  if (travel) navItems.push({ label: 'Travel', href: '#travel' })
  if (faq) navItems.push({ label: 'FAQ', href: '#faq' })

  const firstAnchor = navItems[0]?.href ?? '#registry'
  const rsvpHref = website.isRsvpEnabled ? `${path}/rsvp` : undefined

  return (
    <main id='top' className='w-full bg-[#F7F3EC]'>
      <HeroBackground url={heroUrl}>
        <div className='flex min-h-[92vh] flex-col'>
          <VoyageNavbar
            monogram={monogram}
            coupleNames={coupleNames}
            navItems={navItems}
            rsvpHref={rsvpHref}
          />
          <div className='mx-auto flex w-full max-w-6xl flex-1 items-center px-6 pt-10 pb-16 lg:items-end lg:px-10'>
            <div className='grid w-full items-center gap-12 lg:grid-cols-12 lg:items-end'>
              <div className='flex flex-col gap-7 lg:col-span-7'>
                <h1
                  className={`${headingFont} font-light text-5xl text-[#F7F3EC] leading-[1.08] [text-shadow:0_2px_16px_rgba(13,17,15,0.5)] sm:text-6xl lg:text-7xl`}
                >
                  {heroHeadline ? (
                    <>
                      <span className='whitespace-pre-line'>{heroHeadline}</span>
                      {heroHeadlineAccent ? (
                        <span
                          className={`${scriptFont} mt-2 block text-[#EFE0D2] text-[1.15em] leading-[1.2]`}
                        >
                          {heroHeadlineAccent}
                          <IconHeart className='ml-4 inline-block h-[0.32em] w-[0.32em] align-middle' />
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <>
                      Our Forever
                      <br />
                      Begins in
                      <span
                        className={`${scriptFont} mt-2 block text-[#EFE0D2] text-[1.15em] leading-[1.2]`}
                      >
                        {(location ?? 'Paradise').split(',')[0]}
                        <IconHeart className='ml-4 inline-block h-[0.32em] w-[0.32em] align-middle' />
                      </span>
                    </>
                  )}
                </h1>
                <p
                  className={`${bodyFont} max-w-xl text-[#F7F3EC]/90 text-lg leading-8 [text-shadow:0_1px_10px_rgba(13,17,15,0.45)]`}
                >
                  {introText ??
                    'We can’t wait to celebrate our love with you in the city that stole our hearts.'}
                </p>
                <div className='flex flex-wrap items-center gap-4 pt-1'>
                  {rsvpHref ? <PrimaryButton href={rsvpHref}>RSVP Now</PrimaryButton> : null}
                  <GhostButtonOnDark href={firstAnchor}>View Details</GhostButtonOnDark>
                </div>
              </div>

              {/* Hidden for now — re-enable by uncommenting when ready.
              <HeroCelebrationCard dateLabel={dateLabel} location={location} venue={venue} />
              */}
            </div>
          </div>
        </div>
      </HeroBackground>

      {/* Editorial composition, in the order the design intends. */}
      {ourStory ? <VoyageOurStory content={ourStory.content} imageUrl={aboutImageUrl} /> : null}
      {story ? <VoyageTimeline content={story.content} /> : null}
      {destination ? <VoyageDestination content={destination.content} /> : null}
      <WeekendItinerary events={weddingData.events} />
      {weddingParty ? <VoyageWeddingParty content={weddingParty.content} /> : null}
      <VoyageMoments moments={moments} />
      <VoyageTravelFaq travel={travel?.content ?? null} faq={faq?.content ?? null} />
      <VoyageFlightSearch
        departPlaceholder={flightDepartPlaceholder}
        returnPlaceholder={flightReturnPlaceholder}
      />

      {/* Registry + RSVP invitation, framed with botanical line art. */}
      {registry || rsvpHref ? (
        <section
          id='registry'
          className='relative w-full scroll-mt-24 overflow-hidden bg-[#FBF8F2] px-6 py-20 sm:py-24 lg:px-10'
        >
          <Decor
            name='floralCorner'
            className='pointer-events-none absolute -top-6 -left-8 hidden h-56 w-auto -scale-x-100 -scale-y-100 lg:block'
            fallback={
              <div className='pointer-events-none absolute top-1/2 left-0 hidden -translate-y-1/2 items-end gap-2 lg:flex'>
                <HaciendaSketch className='h-24 w-auto text-[#7C7264]/50' />
                <FloralSpray className='h-[24rem] w-auto opacity-90' />
              </div>
            }
          />
          <Decor
            name='floralCorner'
            className='pointer-events-none absolute -right-8 -bottom-6 hidden h-56 w-auto lg:block'
            fallback={
              <FloralSpray className='pointer-events-none absolute top-1/2 right-0 hidden h-[26rem] w-auto -translate-y-1/2 -scale-x-100 opacity-90 lg:block' />
            }
          />
          <div className='relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16'>
            {registry ? (
              <VoyageRegistry content={registry.content} />
            ) : (
              <div className='flex flex-col gap-6'>
                <Eyebrow>Kindly RSVP</Eyebrow>
                <h2 className={`${sectionHeadingClass} italic leading-tight`}>
                  We can&rsquo;t wait to celebrate with you!
                </h2>
                <GoldRule className='self-start' />
                <p className={`${bodyFont} max-w-xl text-[#6F675D] text-lg leading-8`}>
                  We would be honored to celebrate with you. Let us know if you can make the
                  journey.
                </p>
                <Decor
                  name='hacienda'
                  className='mt-2 hidden h-64 w-auto object-contain lg:block'
                />
              </div>
            )}
            {rsvpHref ? (
              <div className='rounded-[3px] border border-[#DDD2C0] bg-[#F7F3EC] px-8 py-10 text-center'>
                <Eyebrow>Your Invitation</Eyebrow>
                <p className={`${headingFont} mt-4 text-3xl text-[#1D2320]`}>{coupleNames}</p>
                {dateLabel ? (
                  <p
                    className={`${labelFont} mt-2 text-[#6F675D] text-[0.66rem] uppercase tracking-[0.24em]`}
                  >
                    {dateLabel}
                    {location ? ` · ${location}` : ''}
                  </p>
                ) : null}
                <HeartRule className='mt-6' />
                <div className='mt-6 flex justify-center'>
                  <PrimaryButton href={rsvpHref} className='w-full max-w-xs'>
                    Send RSVP
                  </PrimaryButton>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <VoyageFooter
        monogram={monogram}
        coupleNames={coupleNames}
        dateLabel={dateLabel}
        location={location}
      />
    </main>
  )
}

export const VoyageHomeMobile = VoyageHome

function VoyageFooter({
  monogram,
  coupleNames,
  dateLabel,
  location,
}: {
  monogram: string
  coupleNames: string
  dateLabel: string | null
  location: string | null
}) {
  return (
    <footer className='relative w-full overflow-hidden border-[#DDD2C0] border-t bg-[#F7F3EC] px-6 py-16 lg:px-10'>
      <Decor
        name='floralBranch'
        className='pointer-events-none absolute -top-4 -left-6 hidden h-40 w-auto -scale-x-100 opacity-80 lg:block'
        fallback={
          <FloralCorner className='pointer-events-none absolute top-6 left-4 hidden h-20 w-auto -scale-x-100 opacity-60 lg:block' />
        }
      />
      <Decor
        name='floralBranch'
        className='pointer-events-none absolute -top-4 -right-6 hidden h-40 w-auto opacity-80 lg:block'
        fallback={
          <FloralCorner className='pointer-events-none absolute top-6 right-4 hidden h-20 w-auto opacity-60 lg:block' />
        }
      />
      <div className='relative mx-auto flex max-w-6xl flex-col items-center gap-4 text-center'>
        <span className={`${headingFont} text-3xl text-[#1D2320] tracking-[0.2em]`}>
          {monogram}
        </span>
        {dateLabel || location ? (
          <span className={`${labelFont} text-[#6F675D] text-[0.6rem] uppercase tracking-[0.28em]`}>
            {[coupleNames, dateLabel, location].filter(Boolean).join(' · ')}
          </span>
        ) : (
          <span className={`${headingFont} text-2xl text-[#B15C41] italic`}>{coupleNames}</span>
        )}
        <p className={`${scriptFont} mt-1 text-3xl text-[#B15C41]`}>
          Thank you for being part of our beginning
          <IconHeart className='ml-3 inline-block h-4 w-4 align-middle text-[#B15C41]' />
        </p>
      </div>
    </footer>
  )
}
