import Image from 'next/image'
import Link from 'next/link'
import { formatDateStandard } from '~/app/utils/helpers'
import { AureliaNavbar } from '~/templates/aurelia/components/navbar'
import { AureliaSections } from '~/templates/aurelia/components/sections'
import type { TemplateSurfaceProps } from '~/templates/types'

const headingFont = 'font-[family-name:var(--tpl-heading-font)]'

export function AureliaHome({ weddingData, path, introText }: Readonly<TemplateSurfaceProps>) {
  const { website } = weddingData

  return (
    <main className='flex flex-col items-center gap-24 px-6 pb-28'>
      <section className='relative flex w-full max-w-3xl flex-col items-center gap-8 pt-24 text-center'>
        <div
          aria-hidden
          className='absolute top-10 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/15 to-accent/15 blur-3xl'
        />
        <p className='text-[0.7rem] text-accent uppercase tracking-[0.45em]'>
          We're getting married
        </p>
        <h1 className={`${headingFont} text-6xl text-foreground italic leading-tight sm:text-7xl`}>
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
        {weddingData.daysRemaining > 0 && (
          <p className='text-muted-foreground text-sm tracking-[0.2em]'>
            {weddingData.daysRemaining} days to go
          </p>
        )}
        <AureliaNavbar path={path} isRsvpEnabled={website.isRsvpEnabled} />
        {website.isRsvpEnabled && (
          <Link
            href={`${path}/rsvp`}
            className='mt-2 rounded-full bg-primary px-9 py-3 text-[0.72rem] text-primary-foreground uppercase tracking-[0.3em] shadow-sm transition-colors hover:bg-accent'
          >
            RSVP
          </Link>
        )}
      </section>

      {website.coverPhotoUrl && (
        <div className='relative h-96 w-full max-w-4xl overflow-hidden rounded-[28px] border border-border shadow-sm'>
          <Image
            src={website.coverPhotoUrl}
            fill
            sizes='(max-width: 768px) 100vw, 80vw'
            priority
            className='object-cover'
            alt='Website Cover Photo'
          />
        </div>
      )}

      {introText ? (
        <section className='max-w-2xl text-balance text-center text-lg text-muted-foreground leading-9'>
          <p>{introText}</p>
        </section>
      ) : null}

      {weddingData.events.length > 0 && (
        <section className='grid w-full max-w-4xl gap-8 sm:grid-cols-2'>
          {weddingData.events.map((event) => (
            <div
              key={event.id}
              className='flex flex-col items-center gap-3 rounded-[20px] border border-border bg-card px-8 py-10 text-center text-card-foreground'
            >
              <h3 className={`${headingFont} text-3xl text-primary italic`}>{event.name}</h3>
              {!!event.date && (
                <span className='text-muted-foreground text-sm uppercase tracking-[0.2em]'>
                  {formatDateStandard(event.date)}
                </span>
              )}
              {!!event.startTime && (
                <span className='text-muted-foreground text-sm'>
                  {event.startTime}
                  {!!event.endTime && ` – ${event.endTime}`}
                </span>
              )}
              {!!event.venue && (
                <span className='text-foreground text-sm uppercase tracking-[0.18em]'>
                  {event.venue}
                </span>
              )}
            </div>
          ))}
        </section>
      )}

      <AureliaSections sections={weddingData.sections} />

      <section className='flex flex-col items-center gap-3 text-center'>
        <p className={`${headingFont} text-5xl text-foreground italic`}>
          {weddingData.groomFirstName?.[0] ?? 'G'} &amp; {weddingData.brideFirstName?.[0] ?? 'B'}
        </p>
        <span className='h-px w-16 bg-border' />
        <p className='text-muted-foreground text-sm tracking-[0.3em]'>
          {weddingData.date.numberFormat?.toString() ?? 'Date To Be Announced'}
        </p>
      </section>
    </main>
  )
}
