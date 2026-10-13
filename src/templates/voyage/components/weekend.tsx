import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { formatEventTime } from '~/lib/locale/intl-format'
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
  const t = useTranslations('voyage.weekend')
  const locale = useLocale()
  const sorted = orderedEvents(events)
  return (
    <Band className='relative overflow-hidden' id={summary ? 'weekend-preview' : 'schedule'}>
      <Decor
        name='floralSpray2'
        className='pointer-events-none absolute top-20 -left-14 hidden h-80 w-auto opacity-60 xl:block'
      />
      <div className='relative mb-10 flex flex-col items-center gap-4 text-center'>
        <Eyebrow>{t('eyebrow')}</Eyebrow>
        <h2 className={`${scriptFont} text-5xl text-primary sm:text-6xl`}>{t('heading')}</h2>
        {!summary ? (
          <p className={`${bodyFont} text-lg text-muted-foreground`}>{t('localTimes')}</p>
        ) : null}
      </div>
      {sorted.length ? (
        <section
          aria-label={t('scheduleAria')}
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
                      {eventDate(event.date, locale)}
                    </time>
                  ) : (
                    t('dateTba')
                  )}
                </p>
                <p className={`${headingFont} text-2xl`}>
                  {event.startTime
                    ? `${formatEventTime(event.startTime, locale)}${event.endTime ? `–${formatEventTime(event.endTime, locale)}` : ''}`
                    : t('timeTba')}
                </p>
              </div>
              <div className='space-y-4'>
                <h3 className={`${headingFont} text-3xl`}>{event.name}</h3>
                <p className={`${bodyFont} text-lg`}>{event.venue || t('venueTba')}</p>
                {summary ? (
                  <Link
                    href={`${path}/weekend#event-${event.id}`}
                    className={`${labelFont} inline-flex min-h-11 items-center text-primary text-xs underline underline-offset-4`}
                  >
                    {t('eventDetails')}
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
                        {t('directions')}
                      </a>
                    ) : null}
                    {event.description ? (
                      <LinkifiedBlurb
                        text={event.description}
                        className={`${bodyFont} whitespace-pre-line break-words text-lg text-muted-foreground leading-8`}
                      />
                    ) : null}
                    <p className={`${bodyFont} border-border border-t pt-4 text-lg`}>
                      <span className='font-semibold'>{t('whatToWear')}</span>
                      {event.attire || t('dressCodeTba')}
                    </p>
                  </>
                )}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <p className={`${bodyFont} text-center text-lg text-muted-foreground`}>{t('empty')}</p>
      )}
      {summary ? (
        <div className='mt-8 flex justify-center'>
          <OutlineButton href={`${path}/weekend`}>{t('viewFull')}</OutlineButton>
        </div>
      ) : null}
    </Band>
  )
}

export function VoyageDressCode({ events }: { events: VoyageEvent[] }) {
  const t = useTranslations('voyage.weekend')
  return (
    <Band id='what-to-wear' tone='cream'>
      <div className='mx-auto max-w-3xl space-y-6'>
        <Eyebrow>{t('dressCode.eyebrow')}</Eyebrow>
        <h2 className={`${headingFont} text-4xl sm:text-5xl`}>{t('dressCode.heading')}</h2>
        <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
          {t('dressCode.intro')}
        </p>
        {orderedEvents(events).map((event) => (
          <div key={event.id} className='border-border border-t pt-5'>
            <h3 className={`${headingFont} text-2xl`}>{event.name}</h3>
            <p className={`${bodyFont} mt-2 text-lg`}>{event.attire || t('dressCodeTba')}</p>
          </div>
        ))}
        <div className='border-border border-t pt-6'>
          <p className={`${labelFont} mb-2 text-primary text-xs uppercase tracking-widest`}>
            {t('dressCode.moreSoon')}
          </p>
          <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
            {t('dressCode.moreSoonBody')}
          </p>
        </div>
      </div>
    </Band>
  )
}
