import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { AddToCalendarButtons } from '~/components/website/add-to-calendar-buttons'
import { buildSaveTheDateCalendarLinks } from '~/lib/website/calendar'
import { ClassicHeaderImage } from '~/templates/classic/components/media'
import { useTemplateDates } from '~/templates/shared/dates'
import { findWeddingDay } from '~/templates/shared/wedding-day'
import type { TemplateSurfaceProps } from '~/templates/types'

export function ClassicSaveTheDate({ weddingData, path }: Readonly<TemplateSurfaceProps>) {
  const t = useTranslations('templateShared')
  const tTemplate = useTranslations('classic')
  const dates = useTemplateDates()
  const weddingEvent = findWeddingDay(weddingData.events)
  const venue = weddingEvent?.venue
  const copy = weddingData.saveTheDate
  const coupleNames = `${weddingData.brideFirstName} & ${weddingData.groomFirstName}`
  const calendarLinks = buildSaveTheDateCalendarLinks({
    title: t('saveTheDate.calendarTitle', { coupleNames }),
    description: t('saveTheDate.calendarDescription', {
      coupleNames,
      url: weddingData.website.url,
    }),
    location: venue ?? undefined,
    events: weddingData.events,
  })

  return (
    <main className='flex min-h-screen w-full items-center justify-center bg-background px-4 py-12 sm:py-20'>
      <article className='w-full max-w-2xl overflow-hidden rounded-md border border-border bg-card shadow-2xl shadow-zinc-900/10'>
        <ClassicHeaderImage url={weddingData.website.headerImageUrl} />
        <div className='px-6 py-12 sm:px-12 sm:py-16'>
          <div className='flex flex-col items-center gap-8 border border-border/70 px-5 py-12 text-center text-muted-foreground tracking-widest sm:px-10 sm:py-14'>
            <p className='text-primary text-sm uppercase tracking-[0.4em]'>
              {copy?.eyebrow ?? t('saveTheDate.eyebrow')}
            </p>
            <h1 className='font-medium text-5xl text-card-foreground tracking-widest sm:text-6xl'>
              {coupleNames}
            </h1>
            <div className='h-px w-24 bg-border' />
            <p className='text-2xl text-card-foreground'>
              {dates.weddingDate(weddingData.date) ?? t('dateToBeAnnounced')}
            </p>
            {venue ? <p className='text-lg uppercase tracking-[0.3em]'>{venue}</p> : null}
            {weddingData.daysRemaining > 0 && (
              <p className='text-lg'>
                {tTemplate('daysToGo', { count: weddingData.daysRemaining })}
              </p>
            )}
            {copy?.message ? (
              <p className='max-w-xl whitespace-pre-line text-base leading-8 tracking-normal'>
                {copy.message}
              </p>
            ) : null}
            <p className='mt-2 text-sm tracking-normal'>
              {copy?.footnote ?? t('saveTheDate.footnote')}
            </p>
            {calendarLinks ? <AddToCalendarButtons {...calendarLinks} /> : null}
            <Link
              href={path}
              className='text-sm tracking-normal underline underline-offset-4 hover:text-primary'
            >
              {t('saveTheDate.visitWebsite')}
            </Link>
          </div>
        </div>
      </article>
    </main>
  )
}
