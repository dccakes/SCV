import Link from 'next/link'
import { AddToCalendarButtons } from '~/components/website/add-to-calendar-buttons'
import { buildSaveTheDateCalendarLinks } from '~/lib/website/calendar'
import { ClassicHeaderImage } from '~/templates/classic/components/media'
import type { TemplateSurfaceProps } from '~/templates/types'

export function ClassicSaveTheDate({ weddingData, path }: Readonly<TemplateSurfaceProps>) {
  const weddingEvent = weddingData.events.find((event) => event.name === 'Wedding Day')
  const venue = weddingEvent?.venue
  const coupleNames = `${weddingData.groomFirstName} & ${weddingData.brideFirstName}`
  const calendarLinks = buildSaveTheDateCalendarLinks({
    title: `${coupleNames} Wedding`,
    description: `Save the date for the wedding of ${coupleNames}! Formal invitation to follow. ${weddingData.website.url}`,
    location: venue ?? undefined,
    events: weddingData.events,
  })

  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-24 text-center text-zinc-500 tracking-widest'>
      <ClassicHeaderImage url={weddingData.website.headerImageUrl} />
      <p className='text-sm uppercase tracking-[0.4em]'>Save the Date</p>
      <h1 className='font-medium text-6xl tracking-widest'>
        {weddingData.groomFirstName} & {weddingData.brideFirstName}
      </h1>
      <div className='h-px w-24 bg-zinc-300' />
      <p className='text-2xl'>{weddingData.date?.standardFormat ?? 'Date To Be Announced'}</p>
      {venue ? <p className='text-lg uppercase tracking-[0.3em]'>{venue}</p> : null}
      {weddingData.daysRemaining > 0 && (
        <p className='text-lg'>{weddingData.daysRemaining} Days To Go!</p>
      )}
      <p className='mt-6 text-sm tracking-normal'>Formal invitation to follow.</p>
      {calendarLinks ? <AddToCalendarButtons {...calendarLinks} /> : null}
      <Link href={path} className='text-sm underline underline-offset-4 hover:text-pink-500'>
        Visit our website
      </Link>
    </main>
  )
}
