import Link from 'next/link'
import { AureliaHeaderImage } from '~/templates/aurelia/components/media'
import type { TemplateSurfaceProps } from '~/templates/types'

const headingFont = 'font-[family-name:var(--tpl-heading-font)]'

export function AureliaSaveTheDate({ weddingData, path }: Readonly<TemplateSurfaceProps>) {
  const weddingEvent = weddingData.events.find((event) => event.name === 'Wedding Day')
  const venue = weddingEvent?.venue

  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-24 text-center'>
      <div
        aria-hidden
        className='absolute top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/15 to-accent/15 blur-3xl'
      />
      <AureliaHeaderImage url={weddingData.website.headerImageUrl} />
      <p className='text-[0.7rem] text-accent uppercase tracking-[0.45em]'>Save the Date</p>
      <h1 className={`${headingFont} text-6xl text-foreground italic sm:text-7xl`}>
        {weddingData.groomFirstName}
        <span className='mx-3 font-light text-primary not-italic'>&</span>
        {weddingData.brideFirstName}
      </h1>
      <div className='flex items-center gap-4 text-muted-foreground'>
        <span className='h-px w-12 bg-border' />
        <span className='text-sm uppercase tracking-[0.3em]'>
          {weddingData.date?.standardFormat ?? 'Date To Be Announced'}
        </span>
        <span className='h-px w-12 bg-border' />
      </div>
      {venue ? <p className='text-foreground text-sm uppercase tracking-[0.3em]'>{venue}</p> : null}
      {weddingData.daysRemaining > 0 && (
        <p className='text-muted-foreground text-sm tracking-[0.2em]'>
          {weddingData.daysRemaining} days to go
        </p>
      )}
      <p className='text-muted-foreground text-sm'>Formal invitation to follow.</p>
      <Link
        href={path}
        className='text-[0.72rem] text-primary uppercase tracking-[0.3em] underline-offset-4 hover:underline'
      >
        Visit our website
      </Link>
    </main>
  )
}
