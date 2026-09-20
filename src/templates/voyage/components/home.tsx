import Image from 'next/image'
import Link from 'next/link'
import type { TemplateSurfaceProps } from '~/templates/types'
import { Decor } from '~/templates/voyage/components/decor'
import { VoyageFlightSearch } from '~/templates/voyage/components/flight-search'
import { VoyageLegacyLinks } from '~/templates/voyage/components/legacy-links'
import { HeroBackground } from '~/templates/voyage/components/media'
import {
  BotanicalSprig,
  bodyFont,
  Eyebrow,
  GhostButtonOnDark,
  headingFont,
  IconArch,
  IconCompass,
  IconHeart,
  labelFont,
  OutlineButton,
  PrimaryButton,
  scriptFont,
} from '~/templates/voyage/components/primitives'
import { Band, VoyageDestination } from '~/templates/voyage/components/sections'
import { VoyageSiteShell } from '~/templates/voyage/components/site-shell'
import { VoyageWeekend } from '~/templates/voyage/components/weekend'
import { coupleIdentity, eventDateRange, flightDates, sectionOf } from '~/templates/voyage/site'

export function VoyageHome({ weddingData, path, introText }: Readonly<TemplateSurfaceProps>) {
  const { website } = weddingData
  const { coupleNames } = coupleIdentity(weddingData)
  const destination = sectionOf(weddingData.sections, 'DESTINATION')
  const story = sectionOf(weddingData.sections, 'OUR_STORY')
  const faq = sectionOf(weddingData.sections, 'FAQ')
  const deadline = faq?.content.items.find((item) =>
    /(?:when|deadline).*rsvp|rsvp.*(?:when|deadline)/i.test(item.question)
  )?.answer
  const location = destination?.content.location ?? null
  const heroUrl = website.headerImageUrl ?? website.coverPhotoUrl ?? null
  const dateLabel = eventDateRange(weddingData.events) ?? weddingData.date?.standardFormat
  const heroHeadline = website.headline?.trim()
  const heroHeadlineAccent = website.headlineAccent?.trim()
  const rsvpHref = website.isRsvpEnabled ? `${path}/rsvp` : undefined
  return (
    <VoyageSiteShell weddingData={weddingData} path={path} current='home'>
      <VoyageLegacyLinks path={path} />
      <HeroBackground url={heroUrl}>
        <div className='flex min-h-[75svh] flex-col'>
          <div className='mx-auto flex w-full max-w-6xl flex-1 items-center px-6 pt-10 pb-16 lg:items-end lg:px-10'>
            <div className='grid w-full items-center gap-12 lg:grid-cols-12 lg:items-end'>
              <div className='flex flex-col gap-7 lg:col-span-7'>
                <p className={`${labelFont} text-[#F7F3EC] text-sm tracking-widest`}>
                  {coupleNames}
                </p>
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
                <p className={`${bodyFont} text-[#F7F3EC] text-lg`}>
                  {[dateLabel, location].filter(Boolean).join(' · ')}
                </p>
                <div className='flex flex-wrap items-center gap-4 pt-1'>
                  {rsvpHref ? <PrimaryButton href={rsvpHref}>RSVP Now</PrimaryButton> : null}
                  <GhostButtonOnDark href={`${path}/weekend`}>Wedding Details</GhostButtonOnDark>
                </div>
              </div>
            </div>
          </div>
        </div>
      </HeroBackground>

      <nav
        aria-label='Plan your visit'
        className='border-border border-y bg-card px-6 py-7 lg:px-10'
      >
        <div className='mx-auto grid max-w-6xl grid-cols-2 gap-3 md:grid-cols-4'>
          {[
            { label: 'Schedule', detail: 'Every celebration', href: '/weekend' },
            { label: 'Book Your Stay', detail: 'Hotels & wedding rates', href: '/stay' },
            { label: 'Getting Here', detail: 'Flights & transfers', href: '/travel' },
            {
              label: 'What to Wear',
              detail: 'Dress code & guidance',
              href: '/weekend#what-to-wear',
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={`${path}${item.href}`}
              className='group flex min-h-24 flex-col items-center justify-center gap-2 px-3 text-center transition-colors hover:text-primary'
            >
              <span
                className={`${labelFont} text-[0.62rem] text-primary uppercase tracking-[0.26em]`}
              >
                {item.label}
              </span>
              <span className={`${bodyFont} text-base text-muted-foreground`}>{item.detail}</span>
            </Link>
          ))}
        </div>
      </nav>
      {destination ? <VoyageDestination content={destination.content} /> : null}
      <VoyageWeekend events={weddingData.events} path={path} summary />
      {story?.content.body ? (
        <Band tone='cream'>
          <div className='grid items-center gap-10 md:grid-cols-2'>
            <div className='space-y-6'>
              <Eyebrow>Our story</Eyebrow>
              <h2 className={`${headingFont} text-4xl sm:text-5xl`}>The journey to here</h2>
              <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
                {story.content.body.length > 280
                  ? `${story.content.body.slice(0, 280).replace(/\s+\S*$/, '')}…`
                  : story.content.body}
              </p>
              <OutlineButton href={`${path}/story`}>Read our story</OutlineButton>
            </div>
            <div className='relative aspect-[4/3] overflow-hidden rounded-sm bg-secondary'>
              {website.coupleImageUrls[0] ? (
                <Image
                  src={website.coupleImageUrls[0]}
                  alt={coupleNames}
                  fill
                  sizes='(max-width: 768px) 100vw, 50vw'
                  className='object-cover'
                />
              ) : (
                <BotanicalSprig className='absolute inset-0 m-auto h-48 w-32 text-primary/40' />
              )}
            </div>
          </div>
        </Band>
      ) : null}
      <VoyageFlightSearch {...flightDates(weddingData.events)} />
      <Band>
        <div className='mb-10 space-y-4 text-center'>
          <Eyebrow>Things to do</Eyebrow>
          <h2 className={`${headingFont} text-4xl sm:text-5xl`}>A little adventure awaits</h2>
        </div>
        <div className='grid gap-12 md:grid-cols-2 md:gap-16'>
          {[
            {
              title: 'Explore Puebla',
              href: 'puebla',
              description:
                'Our favourite sights, food and day trips for the time between celebrations.',
              Icon: IconArch,
            },
            {
              title: 'Explore Mexico',
              href: 'mexico',
              description:
                'Stay a little longer. Discover our favourite places for a bigger adventure.',
              Icon: IconCompass,
            },
          ].map(({ title, href, description, Icon }) => (
            <div key={href} className='space-y-5 border-border border-t pt-8'>
              <Icon className='h-12 w-12 text-primary' />
              <h3 className={`${headingFont} text-3xl`}>{title}</h3>
              <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>{description}</p>
              <OutlineButton href={`${path}/${href}`}>{title}</OutlineButton>
            </div>
          ))}
        </div>
      </Band>
      <Band tone='cream'>
        <div className='mx-auto flex max-w-3xl flex-col items-center gap-6 text-center'>
          <Decor name='hacienda' className='h-32 w-auto max-w-full object-contain' />
          <Eyebrow>Celebrate with us</Eyebrow>
          <h2 className={`${scriptFont} text-5xl text-primary`}>We can’t wait to see you</h2>
          {rsvpHref ? (
            <>
              {deadline ? <p className={`${bodyFont} text-lg`}>RSVP deadline: {deadline}</p> : null}
              <PrimaryButton href={rsvpHref}>Send RSVP</PrimaryButton>
            </>
          ) : null}
          <Link
            href={`${path}/faq#contact`}
            className={`${bodyFont} inline-flex min-h-11 items-center text-lg text-primary underline underline-offset-4`}
          >
            Questions? Contact us & WhatsApp community
          </Link>
          <p className={`${bodyFont} text-muted-foreground`}>WhatsApp invite link coming soon.</p>
        </div>
      </Band>
    </VoyageSiteShell>
  )
}

export const VoyageHomeMobile = VoyageHome
