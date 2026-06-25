import Link from 'next/link'
import { ClassicHeaderImage } from '~/templates/classic/components/media'
import type { TemplateSurfaceProps } from '~/templates/types'

export function ClassicSaveTheDate({ weddingData, path }: Readonly<TemplateSurfaceProps>) {
  const weddingEvent = weddingData.events.find((event) => event.name === 'Wedding Day')
  const venue = weddingEvent?.venue
  const copy = weddingData.saveTheDate

  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-24 text-center text-zinc-500 tracking-widest'>
      <ClassicHeaderImage url={weddingData.website.headerImageUrl} />
      <p className='text-sm uppercase tracking-[0.4em]'>{copy?.eyebrow ?? 'Save the Date'}</p>
      <h1 className='font-medium text-6xl tracking-widest'>
        {weddingData.groomFirstName} & {weddingData.brideFirstName}
      </h1>
      <div className='h-px w-24 bg-zinc-300' />
      <p className='text-2xl'>{weddingData.date?.standardFormat ?? 'Date To Be Announced'}</p>
      {venue ? <p className='text-lg uppercase tracking-[0.3em]'>{venue}</p> : null}
      {weddingData.daysRemaining > 0 && (
        <p className='text-lg'>{weddingData.daysRemaining} Days To Go!</p>
      )}
      {copy?.message ? (
        <p className='max-w-xl whitespace-pre-line text-base leading-8 tracking-normal'>
          {copy.message}
        </p>
      ) : null}
      <p className='mt-6 text-sm tracking-normal'>
        {copy?.footnote ?? 'Formal invitation to follow.'}
      </p>
      <Link href={path} className='text-sm underline underline-offset-4 hover:text-pink-500'>
        Visit our website
      </Link>
    </main>
  )
}
