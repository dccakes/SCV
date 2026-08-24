import Link from 'next/link'
import { AddToCalendarButtons } from '~/components/website/add-to-calendar-buttons'
import { buildSaveTheDateCalendarLinks } from '~/lib/website/calendar'
import { ClassicHeaderImage } from '~/templates/classic/components/media'
import type { TemplateSurfaceProps } from '~/templates/types'

export function ClassicSaveTheDate({ weddingData, path }: Readonly<TemplateSurfaceProps>) {
  const weddingEvent = weddingData.events.find((event) => event.name === 'Wedding Day')
  const venue = weddingEvent?.venue
  const copy = weddingData.saveTheDate
  const coupleNames = `${weddingData.brideFirstName} & ${weddingData.groomFirstName}`
  const calendarLinks = buildSaveTheDateCalendarLinks({
    title: `${coupleNames} Wedding`,
    description: `Save the date for the wedding of ${coupleNames}! Formal invitation to follow. ${weddingData.website.url}`,
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
              {copy?.eyebrow ?? 'Save the Date'}
            </p>
            <h1 className='font-medium text-5xl text-card-foreground tracking-widest sm:text-6xl'>
              {coupleNames}
            </h1>
            <div className='h-px w-24 bg-border' />
            <p className='text-2xl text-card-foreground'>
              {weddingData.date?.standardFormat ?? 'Date To Be Announced'}
            </p>
            {venue ? <p className='text-lg uppercase tracking-[0.3em]'>{venue}</p> : null}
            {weddingData.daysRemaining > 0 && (
              <p className='text-lg'>{weddingData.daysRemaining} Days To Go!</p>
            )}
            {copy?.message ? (
              <p className='max-w-xl whitespace-pre-line text-base leading-8 tracking-normal'>
                {copy.message}
              </p>
            ) : null}
            <p className='mt-2 text-sm tracking-normal'>
              {copy?.footnote ?? 'Formal invitation to follow.'}
            </p>
            {calendarLinks ? <AddToCalendarButtons {...calendarLinks} /> : null}
            <Link
              href={path}
              className='text-sm tracking-normal underline underline-offset-4 hover:text-primary'
            >
              Visit our website
            </Link>
          </div>
        </div>
      </article>
    </main>
  )
}
