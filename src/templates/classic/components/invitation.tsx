import Link from 'next/link'
import { formatDateStandard } from '~/app/utils/helpers'
import { ClassicHeaderImage } from '~/templates/classic/components/media'
import type { TemplateSurfaceProps } from '~/templates/types'

export function ClassicInvitation({ weddingData, path }: Readonly<TemplateSurfaceProps>) {
  const { website } = weddingData
  const weddingEvent = weddingData.events.find((event) => event.name === 'Wedding Day')

  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-24 text-center text-zinc-500 tracking-widest'>
      <ClassicHeaderImage url={website.headerImageUrl} />
      <p className='text-sm tracking-normal'>Together with their families</p>
      <h1 className='font-medium text-5xl tracking-widest sm:text-6xl'>
        {weddingData.groomFirstName} {weddingData.groomLastName}
      </h1>
      <p className='text-2xl italic'>and</p>
      <h1 className='font-medium text-5xl tracking-widest sm:text-6xl'>
        {weddingData.brideFirstName} {weddingData.brideLastName}
      </h1>
      <p className='mt-4 text-sm tracking-normal'>request the pleasure of your company</p>

      <div className='mt-6 flex flex-col gap-2'>
        <p className='text-xl'>{weddingData.date?.standardFormat ?? 'Date To Be Announced'}</p>
        {weddingEvent?.date && (
          <p className='font-thin text-lg'>{formatDateStandard(weddingEvent.date)}</p>
        )}
        {weddingEvent?.startTime && (
          <p className='font-thin text-lg'>
            {weddingEvent.startTime}
            {weddingEvent.endTime && ` - ${weddingEvent.endTime}`}
          </p>
        )}
        {weddingEvent?.venue && (
          <p className='text-lg uppercase tracking-[0.3em]'>{weddingEvent.venue}</p>
        )}
      </div>

      {website.isRsvpEnabled && (
        <Link
          href={`${path}/rsvp`}
          className='mt-8 rounded-sm bg-primary px-6 py-3 text-primary-foreground tracking-widest hover:bg-pink-500 hover:underline'
        >
          RSVP
        </Link>
      )}
    </main>
  )
}
