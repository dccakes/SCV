import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { AddToCalendarButtons } from '~/components/website/add-to-calendar-buttons'
import { buildSaveTheDateCalendarLinks } from '~/lib/website/calendar'
import { findWeddingDay } from '~/templates/shared/wedding-day'
import type { TemplateSurfaceProps } from '~/templates/types'
import { HeroBackground } from '~/templates/voyage/components/media'
import {
  bodyFont,
  Eyebrow,
  GhostButtonOnDark,
  GoldRule,
  headingFont,
  labelFont,
} from '~/templates/voyage/components/primitives'

export function VoyageSaveTheDate({ weddingData, path }: Readonly<TemplateSurfaceProps>) {
  const t = useTranslations('voyage.saveTheDate')
  const { website } = weddingData
  const heroUrl = website.headerImageUrl ?? website.coverPhotoUrl ?? null
  const weddingEvent = findWeddingDay(weddingData.events) ?? weddingData.events[0]
  const venue = weddingEvent?.venue ?? null
  const dateLabel = weddingData.date?.standardFormat ?? t('dateTba')
  const copy = weddingData.saveTheDate
  const coupleNames = `${weddingData.brideFirstName} & ${weddingData.groomFirstName}`
  const calendarLinks = buildSaveTheDateCalendarLinks({
    title: t('calendarTitle', { names: coupleNames }),
    description: t('calendarDescription', { names: coupleNames, url: website.url }),
    location: venue ?? undefined,
    events: weddingData.events,
  })

  return (
    <main className='w-full'>
      <HeroBackground url={heroUrl}>
        <div className='mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 py-24 text-center text-[#F7F3EC]'>
          <Eyebrow className='text-[#D3BD8A]'>{copy?.eyebrow ?? t('eyebrow')}</Eyebrow>
          <h1 className={`${headingFont} font-light text-5xl italic sm:text-7xl`}>
            {weddingData.brideFirstName}
            <span className='mx-3 text-[#D1B879] not-italic'>&amp;</span>
            {weddingData.groomFirstName}
          </h1>
          <GoldRule className='bg-[#D3BD8A]/70' />
          <p
            className={`${labelFont} text-[#F7F3EC]/90 text-[0.72rem] uppercase tracking-[0.32em]`}
          >
            {dateLabel}
          </p>
          {venue ? (
            <p
              className={`${labelFont} text-[#F7F3EC]/70 text-[0.66rem] uppercase tracking-[0.26em]`}
            >
              {venue}
            </p>
          ) : null}
          {weddingData.daysRemaining > 0 ? (
            <p className={`${bodyFont} text-[#F7F3EC]/70`}>
              {t('daysToGo', { count: weddingData.daysRemaining })}
            </p>
          ) : null}
          {copy?.message ? (
            <p className={`${bodyFont} max-w-xl whitespace-pre-line text-[#F7F3EC]/85 leading-8`}>
              {copy.message}
            </p>
          ) : null}
          <p className={`${bodyFont} text-[#F7F3EC]/70 italic`}>
            {copy?.footnote ?? t('footnote')}
          </p>
          {calendarLinks ? <AddToCalendarButtons {...calendarLinks} /> : null}
          <div className='pt-2'>
            <GhostButtonOnDark href={path}>{t('visitWebsite')}</GhostButtonOnDark>
          </div>
          {website.isRsvpEnabled ? (
            <Link
              href={`${path}/rsvp`}
              className={`${labelFont} text-[#D3BD8A] text-[0.66rem] uppercase tracking-[0.28em] underline-offset-4 hover:underline`}
            >
              {t('rsvp')}
            </Link>
          ) : null}
        </div>
      </HeroBackground>
    </main>
  )
}
