import Link from 'next/link'
import { formatDateStandard } from '~/app/utils/helpers'
import { ClassicHeaderImage } from '~/templates/classic/components/media'
import type { TemplateSurfaceProps } from '~/templates/types'

export function ClassicInvitation({ weddingData, path }: Readonly<TemplateSurfaceProps>) {
  const { website } = weddingData
  const weddingEvent = weddingData.events.find((event) => event.name === 'Wedding Day')
  const copy = weddingData.invitation

  return (
    <main className='flex min-h-screen w-full items-center justify-center bg-background px-4 py-12 sm:py-20'>
      <article className='w-full max-w-2xl overflow-hidden rounded-md border border-border bg-card shadow-2xl shadow-zinc-900/10'>
        <ClassicHeaderImage url={website.headerImageUrl} />
        <div className='px-6 py-12 sm:px-12 sm:py-16'>
          <div className='flex flex-col items-center gap-6 border border-border/70 px-5 py-12 text-center text-muted-foreground tracking-widest sm:px-10 sm:py-14'>
            <p className='text-sm tracking-normal'>
              {copy?.preface ?? 'Together with their families'}
            </p>
            <h1 className='font-medium text-4xl text-card-foreground tracking-widest sm:text-6xl'>
              {weddingData.groomFirstName} {weddingData.groomLastName}
            </h1>
            <p className='text-2xl italic'>and</p>
            <h1 className='font-medium text-4xl text-card-foreground tracking-widest sm:text-6xl'>
              {weddingData.brideFirstName} {weddingData.brideLastName}
            </h1>
            <p className='mt-2 text-sm tracking-normal'>
              {copy?.invitationLine ?? 'request the pleasure of your company'}
            </p>
            {copy?.message ? (
              <p className='max-w-xl whitespace-pre-line text-base leading-8 tracking-normal'>
                {copy.message}
              </p>
            ) : null}

            <div className='my-2 h-px w-24 bg-border' />

            <div className='flex flex-col gap-2'>
              <p className='text-card-foreground text-xl'>
                {weddingData.date?.standardFormat ?? 'Date To Be Announced'}
              </p>
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
                className='mt-6 rounded-sm bg-primary px-8 py-3 text-primary-foreground tracking-widest transition-colors hover:bg-primary/90'
              >
                RSVP
              </Link>
            )}
          </div>
        </div>
      </article>
    </main>
  )
}
