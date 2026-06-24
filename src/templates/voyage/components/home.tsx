/**
 * VoyageHome
 *
 * The long-scroll luxury destination-wedding landing page. It composes a
 * cinematic hero (with the nav overlaid), then lays out the enabled content
 * sections in a bespoke editorial order — interleaving the weekend itinerary
 * (built from the couple's events) and the gallery strip, which are not
 * themselves sections — and closes on a combined registry / RSVP invitation and
 * a dark footer.
 *
 * Every image is optional; each block degrades to an elegant typographic or
 * line-illustrated state when a photo is absent.
 */

import { formatDateStandard } from '~/app/utils/helpers'
import type { WeddingPageData } from '~/server/domains/website/website.types'
import type {
  WebsiteSection,
  WebsiteSectionType,
} from '~/server/domains/website-section/website-section.types'
import type { TemplateSurfaceProps } from '~/templates/types'
import { HeroBackground, VoyageGalleryStrip } from '~/templates/voyage/components/media'
import { VoyageNavbar, type VoyageNavItem } from '~/templates/voyage/components/navbar'
import {
  BotanicalSprig,
  bodyFont,
  Eyebrow,
  GhostButtonOnDark,
  GoldRule,
  headingFont,
  IconCalendar,
  IconCoffee,
  IconDinner,
  IconGlass,
  IconMusic,
  IconPin,
  IconRings,
  IconVenue,
  labelFont,
  PrimaryButton,
} from '~/templates/voyage/components/primitives'
import {
  VoyageDestination,
  VoyageExperiences,
  VoyageFaq,
  VoyageOurStory,
  VoyageRegistry,
  VoyageTimeline,
  VoyageTravel,
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

const WEEKEND_ICONS = [IconGlass, IconRings, IconDinner, IconMusic, IconCoffee]

function eventWhenLabel(event: WeddingEvent): string | null {
  const formatted = event.date ? formatDateStandard(event.date) : undefined
  if (formatted && event.startTime) {
    return `${formatted} · ${event.startTime}`
  }
  return formatted ?? event.startTime ?? null
}

function WeekendItinerary({ events }: { events: WeddingEvent[] }) {
  if (events.length === 0) {
    return null
  }
  const items = events.slice(0, 5)
  return (
    <section
      id='wedding-weekend'
      className='w-full scroll-mt-24 bg-[#F7F3EA] px-6 py-20 sm:py-24 lg:px-10'
    >
      <div className='mx-auto max-w-6xl'>
        <div className='mb-14 flex flex-col items-center gap-4 text-center'>
          <Eyebrow>Wedding Weekend</Eyebrow>
          <h2 className={`${headingFont} font-light text-4xl text-[#1E1C18] sm:text-5xl`}>
            A Weekend to Remember
          </h2>
          <GoldRule />
        </div>
        <ol className='relative grid gap-12 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6'>
          <span
            aria-hidden='true'
            className='absolute top-7 right-[10%] left-[10%] hidden h-px bg-[#B89455]/40 lg:block'
          />
          {items.map((event, index) => {
            const Icon = WEEKEND_ICONS[index % WEEKEND_ICONS.length] ?? IconGlass
            const when = eventWhenLabel(event)
            return (
              <li key={event.id} className='relative flex flex-col items-center gap-3 text-center'>
                <span className='flex h-14 w-14 items-center justify-center rounded-full border border-[#B89455]/60 bg-[#F7F3EA] text-[#B89455] ring-4 ring-[#F7F3EA]'>
                  <Icon className='h-6 w-6' />
                </span>
                {when ? (
                  <span
                    className={`${labelFont} text-[#B89455] text-[0.58rem] uppercase tracking-[0.22em]`}
                  >
                    {when}
                  </span>
                ) : null}
                <span className={`${headingFont} text-2xl text-[#1E1C18] italic`}>
                  {event.name}
                </span>
                {event.venue ? (
                  <span
                    className={`${labelFont} text-[#746E64] text-[0.58rem] uppercase tracking-[0.2em]`}
                  >
                    {event.venue}
                  </span>
                ) : null}
                {event.description ? (
                  <p className={`${bodyFont} max-w-[15rem] text-[#746E64] text-sm leading-6`}>
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

function HeroInfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className='flex items-center gap-4'>
      <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#F8F1E7]/25 text-[#D1B879]'>
        {icon}
      </span>
      <span className={`${labelFont} text-[#F8F1E7]/90 text-[0.66rem] uppercase tracking-[0.24em]`}>
        {children}
      </span>
    </div>
  )
}

export function VoyageHome({ weddingData, path, introText }: Readonly<TemplateSurfaceProps>) {
  const { website } = weddingData
  const groom = weddingData.groomFirstName ?? ''
  const bride = weddingData.brideFirstName ?? ''
  const monogram = `${groom?.[0] ?? 'A'} | ${bride?.[0] ?? 'B'}`.toUpperCase()
  const coupleNames = [groom, bride].filter(Boolean).join(' & ') || 'Our Wedding'

  const heroUrl = website.headerImageUrl ?? website.coverPhotoUrl ?? null
  const dateLabel = weddingData.date?.standardFormat ?? null

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
  const venue = destination?.content.venueName ?? weddingEvent?.venue ?? null

  // Build the in-page nav from what actually exists, in editorial order.
  const navItems: VoyageNavItem[] = []
  if (story || ourStory) navItems.push({ label: 'Our Story', href: '#our-story' })
  if (destination) navItems.push({ label: 'The Destination', href: '#destination' })
  if (weddingData.events.length > 0)
    navItems.push({ label: 'Wedding Weekend', href: '#wedding-weekend' })
  if (travel) navItems.push({ label: 'Travel & Stay', href: '#travel' })
  if (registry) navItems.push({ label: 'Registry', href: '#registry' })

  const firstAnchor = navItems[0]?.href ?? '#registry'
  const rsvpHref = website.isRsvpEnabled ? `${path}/rsvp` : undefined

  return (
    <main id='top' className='w-full bg-[#F7F3EA]'>
      <HeroBackground url={heroUrl}>
        <div className='flex min-h-[92vh] flex-col'>
          <VoyageNavbar
            monogram={monogram}
            coupleNames={coupleNames}
            navItems={navItems}
            rsvpHref={rsvpHref}
          />
          <div className='mx-auto flex w-full max-w-6xl flex-1 items-end px-6 pt-10 pb-16 lg:px-10'>
            <div className='grid w-full items-end gap-12 lg:grid-cols-12'>
              <div className='flex flex-col gap-7 lg:col-span-7'>
                <Eyebrow className='text-[#D1B879]'>{coupleNames}</Eyebrow>
                <h1
                  className={`${headingFont} font-light text-5xl text-[#F8F1E7] leading-[1.04] sm:text-6xl lg:text-7xl`}
                >
                  Our Greatest
                  <br />
                  Adventure
                  <br />
                  Begins <span className='text-[#D1B879] italic'>Here.</span>
                </h1>
                <p className={`${bodyFont} max-w-xl text-[#F8F1E7]/85 text-lg leading-8`}>
                  {introText ??
                    'Join us as we embark on a journey across cities, cultures, and moments — celebrating a love story years in the making.'}
                </p>
                <div className='flex flex-wrap items-center gap-4 pt-1'>
                  <PrimaryButton href={firstAnchor}>Begin the Journey</PrimaryButton>
                  {rsvpHref ? (
                    <GhostButtonOnDark href={rsvpHref}>RSVP Now</GhostButtonOnDark>
                  ) : null}
                </div>
              </div>

              {dateLabel || location || venue ? (
                <div className='lg:col-span-5 lg:justify-self-end'>
                  <div className='flex flex-col gap-5 rounded-[3px] border border-[#F8F1E7]/20 bg-[#0c0b09]/45 px-7 py-7 backdrop-blur-sm'>
                    {dateLabel ? (
                      <HeroInfoRow icon={<IconCalendar className='h-4 w-4' />}>
                        {dateLabel}
                      </HeroInfoRow>
                    ) : null}
                    {location ? (
                      <HeroInfoRow icon={<IconPin className='h-4 w-4' />}>{location}</HeroInfoRow>
                    ) : null}
                    {venue ? (
                      <HeroInfoRow icon={<IconVenue className='h-4 w-4' />}>{venue}</HeroInfoRow>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </HeroBackground>

      {/* Editorial composition, in the order the design intends. */}
      {story ? <VoyageTimeline content={story.content} /> : null}
      {ourStory ? <VoyageOurStory content={ourStory.content} /> : null}
      {destination ? <VoyageDestination content={destination.content} /> : null}
      <WeekendItinerary events={weddingData.events} />
      {experiences ? <VoyageExperiences content={experiences.content} /> : null}
      {weddingParty ? <VoyageWeddingParty content={weddingParty.content} /> : null}
      {travel ? <VoyageTravel content={travel.content} /> : null}
      <VoyageGalleryStrip urls={website.coupleImageUrls} />

      {/* Registry + RSVP invitation. */}
      {registry || rsvpHref ? (
        <section
          id='registry'
          className='w-full scroll-mt-24 bg-[#F7F3EA] px-6 py-20 sm:py-24 lg:px-10'
        >
          <div className='mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16'>
            {registry ? (
              <VoyageRegistry content={registry.content} />
            ) : (
              <div className='flex flex-col gap-6'>
                <Eyebrow>RSVP</Eyebrow>
                <h2
                  className={`${headingFont} font-light text-4xl text-[#1E1C18] leading-tight sm:text-5xl`}
                >
                  Will You Join Us?
                </h2>
                <GoldRule className='self-start' />
                <p className={`${bodyFont} max-w-xl text-[#746E64] text-lg leading-8`}>
                  We would be honored to celebrate with you. Let us know if you can make the
                  journey.
                </p>
              </div>
            )}
            {rsvpHref ? (
              <div className='rounded-[3px] border border-[#DED4C4] bg-[#FBF8F1] px-8 py-10 text-center'>
                <Eyebrow>Your Invitation</Eyebrow>
                <p className={`${headingFont} mt-4 text-3xl text-[#1E1C18]`}>{coupleNames}</p>
                {dateLabel ? (
                  <p
                    className={`${labelFont} mt-2 text-[#746E64] text-[0.66rem] uppercase tracking-[0.24em]`}
                  >
                    {dateLabel}
                    {location ? ` · ${location}` : ''}
                  </p>
                ) : null}
                <div className='mt-7 flex justify-center'>
                  <PrimaryButton href={rsvpHref} className='w-full max-w-xs'>
                    Confirm Your Journey
                  </PrimaryButton>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {faq ? <VoyageFaq content={faq.content} /> : null}

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
    <footer className='w-full bg-[#11110F] px-6 py-16 text-[#F8F1E7] lg:px-10'>
      <div className='mx-auto grid max-w-6xl items-center gap-10 text-center md:grid-cols-3 md:text-left'>
        <div className='flex justify-center md:justify-start'>
          <span className={`${headingFont} text-2xl tracking-[0.2em]`}>{monogram}</span>
        </div>
        <div className='flex flex-col items-center gap-3'>
          <p className={`${bodyFont} max-w-md text-[#F8F1E7]/75 text-sm leading-7`}>
            Thank you for being part of our story. Every destination is more meaningful when shared
            with those you love.
          </p>
          <span className={`${headingFont} text-2xl text-[#D1B879] italic`}>{coupleNames}</span>
          {dateLabel || location ? (
            <span
              className={`${labelFont} text-[#F8F1E7]/60 text-[0.6rem] uppercase tracking-[0.28em]`}
            >
              {[location, dateLabel].filter(Boolean).join(' · ')}
            </span>
          ) : null}
        </div>
        <div className='flex justify-center md:justify-end'>
          <BotanicalSprig className='h-20 w-auto text-[#B89455]/50' />
        </div>
      </div>
    </footer>
  )
}
