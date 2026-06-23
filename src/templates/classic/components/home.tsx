import Image from 'next/image'
import Link from 'next/link'
import { formatDateStandard } from '~/app/utils/helpers'
import type { TemplateSurfaceProps } from '~/templates/types'
import { ClassicNavbar } from './navbar'

export function ClassicHome({ weddingData, path, introText }: Readonly<TemplateSurfaceProps>) {
  const { website } = weddingData

  return (
    <main className='flex flex-col items-center justify-center gap-20 pb-24 text-center text-zinc-500 tracking-widest'>
      <div className='text-center'>
        <h1 className='my-5 font-medium text-6xl tracking-widest'>
          {weddingData.groomFirstName} & {weddingData.brideFirstName}
        </h1>
        <span className='text-lg'>{weddingData.date?.standardFormat ?? 'Date To Be Announced'}</span>
        {weddingData.daysRemaining > 0 && (
          <p className='text-lg'>{weddingData.daysRemaining} Days To Go!</p>
        )}
        <ClassicNavbar path={path} isRsvpEnabled={website.isRsvpEnabled} />
        {website.isRsvpEnabled && (
          <Link
            href={`${path}/rsvp`}
            className='rounded-sm bg-primary px-6 py-3 text-primary-foreground tracking-widest hover:bg-pink-500 hover:underline'
          >
            RSVP
          </Link>
        )}
      </div>

      {website.coverPhotoUrl && (
        <div className='relative h-80 w-full px-10'>
          <Image
            src={website.coverPhotoUrl}
            fill
            sizes='(max-width: 768px) 100vw, 80vw'
            priority
            className='object-contain'
            alt='Website Cover Photo'
          />
        </div>
      )}

      {introText ? (
        <section className='max-w-2xl text-balance px-6 text-lg leading-8 tracking-normal'>
          <p>{introText}</p>
        </section>
      ) : null}

      {weddingData.events.map((event) => (
        <div key={event.id} className='flex flex-col gap-2'>
          <h3 className='text-4xl tracking-widest'>{event.name.toLowerCase()}</h3>
          {!!event.date && (
            <span className='font-thin text-2xl'>{formatDateStandard(event.date)}</span>
          )}
          {!!event.startTime && (
            <span className='font-thin text-2xl'>
              {event.startTime}
              {!!event.endTime && ` - ${event.endTime}`}
            </span>
          )}
        </div>
      ))}

      <div className='text-center'>
        <h2 className='border-black border-b px-5 pb-6 text-6xl'>
          {weddingData.groomFirstName?.[0] ?? 'G'} & {weddingData.brideFirstName?.[0] ?? 'B'}
        </h2>
        <p className='mt-4 text-lg tracking-widest'>
          {weddingData.date.numberFormat?.toString() ?? 'Date To Be Announced'}
        </p>
      </div>
    </main>
  )
}
