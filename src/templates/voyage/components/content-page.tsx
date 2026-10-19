import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
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
  identityCopy,
  sectionOf,
  type VoyagePage,
  voyagePages,
} from '~/templates/voyage/site'

function PageLinks({ path, items }: { path: string; items: { label: string; href: string }[] }) {
  const t = useTranslations('voyage.content')
  return (
    <nav
      aria-label={t('relatedAria')}
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
  const t = useTranslations('voyage.content.contact')
  const tIdentity = useTranslations('voyage.identity')
  const { contactNames } = coupleIdentity(weddingData, identityCopy(tIdentity))
  return (
    <Band id='contact' tone='cream'>
      <div className='grid gap-8 md:grid-cols-2'>
        <div className='space-y-4'>
          <Eyebrow>{t('eyebrow')}</Eyebrow>
          <h2 className={`${headingFont} text-4xl`}>{t('heading')}</h2>
          <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
            {t('body', { names: contactNames })}
          </p>
        </div>
        <div className='space-y-4 border-border border-t pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-10'>
          <Eyebrow>{t('communityEyebrow')}</Eyebrow>
          <h2 className={`${headingFont} text-3xl`}>{t('communityHeading')}</h2>
          <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
            {t('communityBody')}
          </p>
          <OutlineButton external href='https://chat.whatsapp.com/IOxwS7icvCoEclNlRBbvwa?mode=gi_t'>
            {t('communityCta')}
          </OutlineButton>
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
  const tPages = useTranslations('voyage.pages')
  return (
    <VoyageSiteShell weddingData={weddingData} path={path} current={page}>
      <VoyagePageHeading
        title={tPages(voyagePages[page].titleKey)}
        description={tPages(voyagePages[page].descriptionKey)}
        path={path}
      />
      <PageContent weddingData={weddingData} path={path} page={page} />
    </VoyageSiteShell>
  )
}

function PageContent({ weddingData, path, page }: TemplateSurfaceProps & { page: VoyagePage }) {
  const t = useTranslations('voyage.content')
  const locale = useLocale()
  const { sections, events, website } = weddingData
  const travel = sectionOf(sections, 'TRAVEL')
  switch (page) {
    case 'weekend': {
      return (
        <>
          <PageLinks
            path={path}
            items={[
              { label: t('weekend.links.schedule'), href: '/weekend#schedule' },
              { label: t('weekend.links.wear'), href: '/weekend#what-to-wear' },
              { label: t('weekend.links.transport'), href: '/weekend#wedding-transport' },
            ]}
          />
          <VoyageWeekend events={events} path={path} />
          <Band id='wedding-transport' tone='cream'>
            <div className='mx-auto max-w-3xl space-y-4'>
              <h2 className={`${headingFont} text-4xl`}>{t('weekend.transportHeading')}</h2>
              <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
                {t('weekend.transportBody')}
              </p>
              <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
                {t('weekend.walkingDistance')}
              </p>
              <OutlineButton href={`${path}/weekend#schedule`}>{t('weekend.venues')}</OutlineButton>
            </div>
          </Band>
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
              { label: t('stay.links.gettingHere'), href: '/travel' },
              { label: t('stay.links.schedule'), href: '/weekend' },
              { label: t('stay.links.contact'), href: '/faq#contact' },
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
              { label: t('travel.links.dates'), href: '/travel#dates' },
              { label: t('travel.links.transfers'), href: '/travel#transfers' },
              { label: t('travel.links.hotels'), href: '/stay' },
              { label: t('travel.links.puebla'), href: '/puebla' },
              { label: t('travel.links.mexico'), href: '/mexico' },
            ]}
          />
          <Band id='dates'>
            <div className='mx-auto max-w-3xl space-y-5'>
              <Eyebrow>{t('travel.eyebrow')}</Eyebrow>
              <h2 className={`${headingFont} text-4xl`}>{t('travel.heading')}</h2>
              <p className={`${bodyFont} text-xl`}>
                {eventDateRange(events, locale) || t('travel.datesFallback')}
              </p>
              <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
                {t('travel.body')}
              </p>
              <OutlineButton href={`${path}/weekend`}>{t('travel.checkSchedule')}</OutlineButton>
            </div>
          </Band>
          <Band id='transfers' tone='cream'>
            <div className='mx-auto max-w-4xl space-y-8'>
              <div className='space-y-4'>
                <Eyebrow>{t('travel.transfersEyebrow')}</Eyebrow>
                <h2 className={`${headingFont} text-4xl sm:text-5xl`}>
                  {t('travel.transfersHeading')}
                </h2>
                <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
                  {t('travel.transfersIntro')}
                </p>
              </div>
              <div className='grid gap-10 md:grid-cols-2'>
                <div className='space-y-4'>
                  <h3 className={`${headingFont} text-3xl`}>{t('travel.busHeading')}</h3>
                  <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
                    {t('travel.busBody')}
                  </p>
                </div>
                <div className='space-y-4'>
                  <h3 className={`${headingFont} text-3xl`}>{t('travel.driversHeading')}</h3>
                  <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
                    {t('travel.driversBody')}
                  </p>
                  <p
                    className={`${labelFont} text-[0.62rem] text-primary uppercase tracking-[0.2em]`}
                  >
                    {t('travel.contactsSoon')}
                  </p>
                </div>
              </div>
            </div>
          </Band>
          <Band>
            <VoyagePracticalInfo />
          </Band>
        </>
      )
    case 'puebla':
      return (
        <>
          <PageLinks
            path={path}
            items={[
              { label: t('puebla.links.mexico'), href: '/mexico' },
              { label: t('puebla.links.gettingAround'), href: '/travel#transfers' },
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
              { label: t('mexico.links.cityGuide'), href: '/mexico#mexico-city' },
              { label: t('mexico.links.puebla'), href: '/puebla' },
              { label: t('mexico.links.travel'), href: '/travel' },
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
              <p className={`${bodyFont} text-center text-lg`}>{t('story.comingSoon')}</p>
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
              { label: t('faq.links.wear'), href: '/weekend#what-to-wear' },
              { label: t('faq.links.hotels'), href: '/stay' },
              { label: t('faq.links.travel'), href: '/travel' },
              { label: t('faq.links.contact'), href: '/faq#contact' },
            ]}
          />
          {faq?.content.items.length ? (
            <Band id='questions'>
              <div className='mx-auto max-w-3xl space-y-4'>
                <h2 className={`${headingFont} mb-8 text-4xl`}>{t('faq.heading')}</h2>
                {faq.content.items.map((item) => {
                  // Keep authored answers intact; contextual links help guests find the full details.
                  // Questions may arrive in English or Spanish, so match both.
                  const destination =
                    /dress code|what.*wear|vestimenta|qu[eé].*(poner|vestir)/i.test(item.question)
                      ? '/weekend#what-to-wear'
                      : /hotel.*(block|discount|descuento|tarifa)|accommodation|hospedaje/i.test(
                            item.question
                          )
                        ? '/stay'
                        : /airport|shuttle|aeropuerto|traslado/i.test(item.question)
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
                          {destination.startsWith('/weekend')
                            ? t('faq.seeWear')
                            : destination === '/stay'
                              ? t('faq.seeStay')
                              : t('faq.seeTravel')}
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
      const links =
        registry?.content.links.filter(
          (link) => !/coming soon|pr[oó]ximamente|muy pronto/i.test(link.label)
        ) ?? []
      return (
        <Band>
          <div className='mx-auto max-w-3xl'>
            {registry ? (
              <VoyageRegistry content={{ ...registry.content, links }} />
            ) : (
              <p className={`${bodyFont} text-lg`}>{t('registry.fallback')}</p>
            )}
            {!links.length ? (
              <p className={`${bodyFont} mt-6 text-lg text-muted-foreground`}>
                {t('registry.comingSoon')}
              </p>
            ) : null}
          </div>
        </Band>
      )
    }
  }
}
