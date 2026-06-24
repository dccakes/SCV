import Link from 'next/link'
import { formatDateStandard } from '~/app/utils/helpers'
import { AureliaHeaderImage } from '~/templates/aurelia/components/media'
import type { TemplateSurfaceProps } from '~/templates/types'

const headingFont = 'font-[family-name:var(--tpl-heading-font)]'

export function AureliaInvitation({ weddingData, path }: Readonly<TemplateSurfaceProps>) {
  const { website } = weddingData
  const weddingEvent = weddingData.events.find((event) => event.name === 'Wedding Day')

  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-24'>
      <AureliaHeaderImage url={website.headerImageUrl} />
      <div className='flex w-full max-w-xl flex-col items-center gap-6 rounded-[28px] border border-border bg-card px-10 py-16 text-center text-card-foreground shadow-sm'>
        <p className='text-muted-foreground text-sm'>Together with their families</p>
        <h1 className={`${headingFont} text-4xl text-foreground italic sm:text-5xl`}>
          {weddingData.groomFirstName} {weddingData.groomLastName}
        </h1>
        <p className='text-muted-foreground text-xl italic'>and</p>
        <h1 className={`${headingFont} text-4xl text-foreground italic sm:text-5xl`}>
          {weddingData.brideFirstName} {weddingData.brideLastName}
        </h1>
        <p className='mt-2 text-muted-foreground text-sm'>request the pleasure of your company</p>

        <span className='my-2 h-px w-16 bg-border' />

        <div className='flex flex-col gap-2'>
          <p className='text-foreground text-lg uppercase tracking-[0.2em]'>
            {weddingData.date?.standardFormat ?? 'Date To Be Announced'}
          </p>
          {weddingEvent?.date && (
            <p className='text-muted-foreground text-sm'>{formatDateStandard(weddingEvent.date)}</p>
          )}
          {weddingEvent?.startTime && (
            <p className='text-muted-foreground text-sm'>
              {weddingEvent.startTime}
              {weddingEvent.endTime && ` – ${weddingEvent.endTime}`}
            </p>
          )}
          {weddingEvent?.venue && (
            <p className='text-foreground text-sm uppercase tracking-[0.18em]'>
              {weddingEvent.venue}
            </p>
          )}
        </div>

        {website.isRsvpEnabled && (
          <Link
            href={`${path}/rsvp`}
            className='mt-6 rounded-full bg-primary px-9 py-3 text-[0.72rem] text-primary-foreground uppercase tracking-[0.3em] transition-colors hover:bg-accent'
          >
            RSVP
          </Link>
        )}
      </div>
    </main>
  )
}
