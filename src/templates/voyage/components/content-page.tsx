import Link from 'next/link'
import type { TemplateSurfaceProps } from '~/templates/types'
import { VoyageFlightSearch } from '~/templates/voyage/components/flight-search'
import { VoyageMoments } from '~/templates/voyage/components/media'
import {
  VoyageExploreMexico,
  VoyagePracticalInfo,
  VoyageZocalo,
} from '~/templates/voyage/components/mexico-guide'
import {
  bodyFont,
  Eyebrow,
  headingFont,
  labelFont,
  OutlineButton,
} from '~/templates/voyage/components/primitives'
import {
  Band,
  LinkifiedBlurb,
  VoyageDestination,
  VoyageOurStory,
  VoyageRegistry,
  VoyageTimeline,
  VoyageWeddingParty,
} from '~/templates/voyage/components/sections'
import { VoyagePageHeading, VoyageSiteShell } from '~/templates/voyage/components/site-shell'
import { VoyageStays } from '~/templates/voyage/components/stays'
import { VoyageDressCode, VoyageWeekend } from '~/templates/voyage/components/weekend'
import {
  coupleIdentity,
  eventDateRange,
  flightDates,
  sectionOf,
  type VoyagePage,
  voyagePages,
} from '~/templates/voyage/site'

function PageLinks({ path, items }: { path: string; items: { label: string; href: string }[] }) {
  return (
    <nav
      aria-label='Related information'
      className='flex flex-wrap justify-center gap-3 border-border border-b px-6 py-3'
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={`${path}${item.href}`}
          className={`${labelFont} inline-flex min-h-11 items-center rounded-sm border border-border px-4 text-xs hover:border-primary hover:text-primary`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}

export function VoyageContact({ weddingData }: Pick<TemplateSurfaceProps, 'weddingData'>) {
  return (
    <Band id='contact' tone='cream'>
      <div className='grid gap-8 md:grid-cols-2'>
        <div className='space-y-4'>
          <Eyebrow>We’re here to help</Eyebrow>
          <h2 className={`${headingFont} text-4xl`}>Have a question?</h2>
          <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
            Please contact {coupleIdentity(weddingData).contactNames} with any questions—we’re happy
            to help.
          </p>
        </div>
        <div className='space-y-4 rounded-sm border border-border p-7'>
          <Eyebrow>Stay in the loop</Eyebrow>
          <h2 className={`${headingFont} text-3xl`}>Our WhatsApp community</h2>
          <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
            A place for wedding updates and questions as we get closer to the celebration.
          </p>
          <p className={`${labelFont} text-primary text-xs uppercase tracking-widest`}>
            Invite link coming soon
          </p>
        </div>
      </div>
    </Band>
  )
}

export function VoyageContentPage({
  weddingData,
  path,
  page,
}: TemplateSurfaceProps & { page: VoyagePage }) {
  return (
    <VoyageSiteShell weddingData={weddingData} path={path} current={page}>
      <VoyagePageHeading {...voyagePages[page]} path={path} />
      <PageContent weddingData={weddingData} path={path} page={page} />
    </VoyageSiteShell>
  )
}

function PageContent({ weddingData, path, page }: TemplateSurfaceProps & { page: VoyagePage }) {
  const { sections, events, website } = weddingData
  const travel = sectionOf(sections, 'TRAVEL')
  switch (page) {
    case 'weekend': {
      const destination = sectionOf(sections, 'DESTINATION')
      return (
        <>
          <PageLinks
            path={path}
            items={[
              { label: 'Schedule', href: '/weekend#schedule' },
              { label: 'What to Wear', href: '/weekend#what-to-wear' },
              { label: 'Wedding transport', href: '/travel#wedding-transport' },
            ]}
          />
          <VoyageWeekend events={events} path={path} />
          <VoyageDressCode events={events} />
          {destination ? <VoyageDestination content={destination.content} /> : null}
        </>
      )
    }
    case 'stay':
      return (
        <>
          <PageLinks
            path={path}
            items={[
              { label: 'Getting here', href: '/travel' },
              { label: 'Wedding schedule', href: '/weekend' },
              { label: 'Questions? Contact us', href: '/faq#contact' },
            ]}
          />
          <VoyageStays content={travel?.content} />
        </>
      )
    case 'travel':
      return (
        <>
          <PageLinks
            path={path}
            items={[
              { label: 'When to travel', href: '/travel#dates' },
              { label: 'Flights', href: '/travel#flights' },
              { label: 'Transfers & getting around', href: '/travel#transfers' },
              { label: 'Hotels', href: '/stay' },
            ]}
          />
          <Band id='dates'>
            <div className='mx-auto max-w-3xl space-y-5'>
              <Eyebrow>Plan your journey</Eyebrow>
              <h2 className={`${headingFont} text-4xl`}>When to travel</h2>
              <p className={`${bodyFont} text-xl`}>
                {eventDateRange(events) || 'Event dates will be shared here once confirmed.'}
              </p>
              <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
                Allow time to settle in before your first event. The flight search suggests arriving
                the day before the first scheduled event and leaving the day after the last; adjust
                these dates to suit your plans.
              </p>
              <OutlineButton href={`${path}/weekend`}>Check the schedule</OutlineButton>
            </div>
          </Band>
          <VoyageFlightSearch {...flightDates(events)} />
          <Band id='transfers'>
            <VoyagePracticalInfo />
          </Band>
          {travel?.content.services?.length ? (
            <Band id='travel-notes' tone='cream'>
              <Eyebrow>From us to you</Eyebrow>
              <div className='mt-6 grid gap-8 md:grid-cols-2'>
                {travel.content.services.map((service) => (
                  <div key={service.title} className='space-y-3'>
                    <h2 className={`${headingFont} text-3xl`}>{service.title}</h2>
                    <LinkifiedBlurb
                      text={service.description}
                      className={`${bodyFont} whitespace-pre-line text-lg text-muted-foreground leading-8`}
                    />
                  </div>
                ))}
              </div>
            </Band>
          ) : null}
          <Band id='wedding-transport'>
            <div className='mx-auto max-w-3xl space-y-4'>
              <h2 className={`${headingFont} text-4xl`}>Getting to the celebrations</h2>
              <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
                Venue details and directions are listed with each event. Any arranged wedding
                transport and pickup times will be shared here once confirmed.
              </p>
              <OutlineButton href={`${path}/weekend`}>Venues & directions</OutlineButton>
            </div>
          </Band>
        </>
      )
    case 'puebla':
      return (
        <>
          <PageLinks
            path={path}
            items={[
              { label: 'Extending your trip? Explore Mexico', href: '/mexico' },
              { label: 'Getting around', href: '/travel#transfers' },
            ]}
          />
          <VoyageZocalo />
        </>
      )
    case 'mexico':
      return (
        <>
          <PageLinks
            path={path}
            items={[
              { label: 'Staying nearby? Explore Puebla', href: '/puebla' },
              { label: 'Travel information', href: '/travel' },
            ]}
          />
          <VoyageExploreMexico />
        </>
      )
    case 'story': {
      const story = sectionOf(sections, 'OUR_STORY')
      const timeline = sectionOf(sections, 'TIMELINE')
      const party = sectionOf(sections, 'WEDDING_PARTY')
      const experiences = sectionOf(sections, 'EXPERIENCES')
      const moments = experiences?.content.items.some((item) => item.imageUrl)
        ? experiences.content.items.flatMap((item) =>
            item.imageUrl ? [{ ...item, imageUrl: item.imageUrl }] : []
          )
        : website.coupleImageUrls.map((imageUrl) => ({ imageUrl }))
      return (
        <>
          {story ? (
            <VoyageOurStory content={story.content} imageUrl={website.coupleImageUrls[0]} />
          ) : null}
          {timeline ? <VoyageTimeline content={timeline.content} /> : null}
          {party ? <VoyageWeddingParty content={party.content} /> : null}
          <VoyageMoments moments={moments} />
          {!story && !timeline && !party && !moments.length ? (
            <Band>
              <p className={`${bodyFont} text-center text-lg`}>
                Our story and favourite moments are coming soon.
              </p>
            </Band>
          ) : null}
        </>
      )
    }
    case 'faq': {
      const faq = sectionOf(sections, 'FAQ')
      return (
        <>
          <PageLinks
            path={path}
            items={[
              { label: 'What to Wear', href: '/weekend#what-to-wear' },
              { label: 'Hotel booking details', href: '/stay' },
              { label: 'Travel & transfers', href: '/travel' },
              { label: 'Contact & WhatsApp', href: '/faq#contact' },
            ]}
          />
          {faq?.content.items.length ? (
            <Band id='questions'>
              <div className='mx-auto max-w-3xl space-y-4'>
                <h2 className={`${headingFont} mb-8 text-4xl`}>Questions & Answers</h2>
                {faq.content.items.map((item) => {
                  // Keep authored answers intact; contextual links help guests find the full details.
                  const destination = /dress code|what.*wear/i.test(item.question)
                    ? '/weekend#what-to-wear'
                    : /hotel.*(block|discount)|accommodation/i.test(item.question)
                      ? '/stay'
                      : /airport|shuttle/i.test(item.question)
                        ? '/travel#transfers'
                        : null
                  return (
                    <details
                      key={item.question}
                      className='rounded-sm border border-border bg-card px-5 py-4'
                    >
                      <summary className={`${headingFont} cursor-pointer text-xl`}>
                        {item.question}
                      </summary>
                      <LinkifiedBlurb
                        text={item.answer}
                        className={`${bodyFont} mt-3 whitespace-pre-line break-words text-lg text-muted-foreground leading-8`}
                      />
                      {destination ? (
                        <Link
                          href={`${path}${destination}`}
                          className={`${bodyFont} mt-3 inline-flex min-h-11 items-center text-lg text-primary underline underline-offset-4`}
                        >
                          See{' '}
                          {destination.startsWith('/weekend')
                            ? 'what to wear for each event'
                            : destination === '/stay'
                              ? 'hotel rates and booking instructions'
                              : 'travel and transfer details'}{' '}
                          →
                        </Link>
                      ) : null}
                    </details>
                  )
                })}
              </div>
            </Band>
          ) : null}
          <VoyageContact weddingData={weddingData} />
        </>
      )
    }
    case 'registry': {
      const registry = sectionOf(sections, 'REGISTRY')
      const links = registry?.content.links.filter((link) => !/coming soon/i.test(link.label)) ?? []
      return (
        <Band>
          <div className='mx-auto max-w-3xl'>
            {registry ? (
              <VoyageRegistry content={{ ...registry.content, links }} />
            ) : (
              <p className={`${bodyFont} text-lg`}>Your presence is the greatest gift.</p>
            )}
            {!links.length ? (
              <p className={`${bodyFont} mt-6 text-lg text-muted-foreground`}>
                Details coming soon.
              </p>
            ) : null}
          </div>
        </Band>
      )
    }
  }
}
