import Link from 'next/link'
import { Decor } from '~/templates/voyage/components/decor'
import {
  bodyFont,
  Eyebrow,
  headingFont,
  labelFont,
  OutlineButton,
  scriptFont,
} from '~/templates/voyage/components/primitives'
import { Band, LinkifiedBlurb } from '~/templates/voyage/components/sections'
import { eventDate, orderedEvents, type VoyageEvent } from '~/templates/voyage/site'

export function VoyageWeekend({
  events,
  path,
  summary = false,
}: {
  events: VoyageEvent[]
  path: string
  summary?: boolean
}) {
  const sorted = orderedEvents(events)
  return (
    <Band className='relative overflow-hidden' id={summary ? 'weekend-preview' : 'schedule'}>
      <Decor
        name='floralSpray2'
        className='pointer-events-none absolute top-20 -left-14 hidden h-80 w-auto opacity-60 xl:block'
      />
      <div className='relative mb-10 flex flex-col items-center gap-4 text-center'>
        <Eyebrow>Wedding Weekend</Eyebrow>
        <h2 className={`${scriptFont} text-5xl text-primary sm:text-6xl`}>
          Let’s Celebrate Together
        </h2>
        {!summary ? (
          <p className={`${bodyFont} text-lg text-muted-foreground`}>
            All times are local to the event venue.
          </p>
        ) : null}
      </div>
      {sorted.length ? (
        <section
          aria-label='Schedule'
          className={`relative grid gap-8 ${summary ? 'md:grid-cols-3' : ''}`}
        >
          {sorted.map((event) => (
            <article
              key={event.id}
              id={summary ? undefined : `event-${event.id}`}
              className={`scroll-mt-24 border-border border-t py-8 ${summary ? '' : 'grid gap-6 md:grid-cols-[15rem_1fr]'}`}
            >
              <div className='space-y-3'>
                <p className={`${labelFont} text-primary text-xs uppercase tracking-widest`}>
                  {event.date ? (
                    <time dateTime={event.date.toISOString().slice(0, 10)}>
                      {eventDate(event.date)}
                    </time>
                  ) : (
                    'Date to be announced'
                  )}
                </p>
                <p className={`${headingFont} text-2xl`}>
                  {event.startTime
                    ? `${event.startTime}${event.endTime ? `–${event.endTime}` : ''}`
                    : 'Time to be announced'}
                </p>
              </div>
              <div className='space-y-4'>
                <h3 className={`${headingFont} text-3xl`}>{event.name}</h3>
                <p className={`${bodyFont} text-lg`}>
                  {event.venue || 'Venue details coming soon'}
                </p>
                {summary ? (
                  <Link
                    href={`${path}/weekend#event-${event.id}`}
                    className={`${labelFont} inline-flex min-h-11 items-center text-primary text-xs underline underline-offset-4`}
                  >
                    Event details →
                  </Link>
                ) : (
                  <>
                    {event.venue ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}`}
                        target='_blank'
                        rel='noreferrer'
                        className={`${labelFont} inline-flex min-h-11 items-center text-primary text-xs underline underline-offset-4`}
                      >
                        Get directions ↗
                      </a>
                    ) : null}
                    {event.description ? (
                      <LinkifiedBlurb
                        text={event.description}
                        className={`${bodyFont} whitespace-pre-line break-words text-lg text-muted-foreground leading-8`}
                      />
                    ) : null}
                    <p className={`${bodyFont} border-border border-t pt-4 text-lg`}>
                      <span className='font-semibold'>What to wear: </span>
                      {event.attire || 'Dress code to be announced'}
                    </p>
                  </>
                )}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <p className={`${bodyFont} text-center text-lg text-muted-foreground`}>
          The schedule will appear here as our plans are confirmed.
        </p>
      )}
      {summary ? (
        <div className='mt-8 flex justify-center'>
          <OutlineButton href={`${path}/weekend`}>View the full weekend</OutlineButton>
        </div>
      ) : null}
    </Band>
  )
}

export function VoyageDressCode({ events }: { events: VoyageEvent[] }) {
  return (
    <Band id='what-to-wear' tone='cream'>
      <div className='mx-auto max-w-3xl space-y-6'>
        <Eyebrow>Dress code</Eyebrow>
        <h2 className={`${headingFont} text-4xl sm:text-5xl`}>What to Wear</h2>
        <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
          A little guidance for each celebration, so you can pack with confidence.
        </p>
        {orderedEvents(events).map((event) => (
          <div key={event.id} className='border-border border-t pt-5'>
            <h3 className={`${headingFont} text-2xl`}>{event.name}</h3>
            <p className={`${bodyFont} mt-2 text-lg`}>
              {event.attire || 'Dress code to be announced'}
            </p>
          </div>
        ))}
        <div className='border-border border-t pt-6'>
          <p className={`${labelFont} mb-2 text-primary text-xs uppercase tracking-widest`}>
            More guidance coming soon
          </p>
          <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
            Outfit suggestions, footwear advice and any finishing touches will appear here once the
            details are confirmed.
          </p>
        </div>
      </div>
    </Band>
  )
}
