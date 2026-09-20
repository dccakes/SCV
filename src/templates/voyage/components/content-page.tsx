import Link from 'next/link'
import type { TemplateSurfaceProps } from '~/templates/types'
import { VoyageMoments } from '~/templates/voyage/components/media'
import { VoyageMexicoCity } from '~/templates/voyage/components/mexico-city'
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
  sectionOf,
  type VoyagePage,
  voyagePages,
} from '~/templates/voyage/site'

function PageLinks({ path, items }: { path: string; items: { label: string; href: string }[] }) {
  return (
    <nav
      aria-label='Related information'
      className='mx-auto grid max-w-6xl grid-cols-2 justify-center gap-3 border-border border-b px-6 py-4 sm:flex sm:flex-wrap'
    >
      {items.map((item) => (
        <OutlineButton
          key={item.href}
          href={`${path}${item.href}`}
          className='px-4 py-3 text-center text-[0.6rem] tracking-[0.16em]'
        >
          {item.label}
        </OutlineButton>
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
        <div className='space-y-4 border-border border-t pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-10'>
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
              { label: 'Travel dates', href: '/travel#dates' },
              { label: 'Transfers', href: '/travel#transfers' },
              { label: 'Hotels', href: '/stay' },
              { label: 'Explore Puebla', href: '/puebla' },
              { label: 'Explore Mexico', href: '/mexico' },
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
                Allow time to settle in before your first event, and leave enough time for your
                onward journey after the celebrations.
              </p>
              <OutlineButton href={`${path}/weekend`}>Check the schedule</OutlineButton>
            </div>
          </Band>
          <Band id='transfers' tone='cream'>
            <div className='mx-auto max-w-4xl space-y-8'>
              <div className='space-y-4'>
                <Eyebrow>Getting to Puebla</Eyebrow>
                <h2 className={`${headingFont} text-4xl sm:text-5xl`}>Mexico City to Puebla</h2>
                <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
                  If you’re arriving at Mexico City International Airport (MEX / AICM), you can
                  continue directly to Puebla by bus or arrange a private transfer.
                </p>
              </div>
              <div className='grid gap-10 md:grid-cols-2'>
                <div className='space-y-4'>
                  <h3 className={`${headingFont} text-3xl`}>By bus from the airport</h3>
                  <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
                    Estrella Roja runs hourly buses from Terminal 1 and Terminal 2 to Puebla.
                    Tickets can be bought on site at the airport bus ticket counters. Check the
                    Puebla drop-off point before arranging the final journey to your hotel. Allow
                    time for immigration, baggage collection and traffic when planning your
                    connection.
                  </p>
                </div>
                <div className='space-y-4'>
                  <h3 className={`${headingFont} text-3xl`}>Drivers & private transfers</h3>
                  <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
                    We’ll add known driver contacts and private transfer options here closer to the
                    wedding, including how to book and arrange your pickup.
                  </p>
                  <p
                    className={`${labelFont} text-[0.62rem] text-primary uppercase tracking-[0.2em]`}
                  >
                    Contacts coming soon
                  </p>
                </div>
              </div>
            </div>
          </Band>
          <Band>
            <VoyagePracticalInfo />
          </Band>
          <Band id='wedding-transport'>
            <div className='mx-auto max-w-3xl space-y-4'>
              <h2 className={`${headingFont} text-4xl`}>Getting to the celebrations</h2>
              <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
                We’ll provide transport from Puebla city centre to the ceremony venue and back, so
                you won’t need to arrange your own journey. Pickup locations and times will be
                shared here closer to the wedding.
              </p>
              <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
                All other events will be within walking distance of Puebla city centre.
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
              { label: 'Mexico City guide', href: '/mexico#mexico-city' },
              { label: 'Staying nearby? Explore Puebla', href: '/puebla' },
              { label: 'Travel information', href: '/travel' },
            ]}
          />
          <VoyageExploreMexico />
          <VoyageMexicoCity />
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
                      className='border border-border bg-background px-5 py-4'
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
