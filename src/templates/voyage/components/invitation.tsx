import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { formatEventTime, toIntlLocale } from '~/lib/locale/intl-format'
import { findWeddingDay } from '~/templates/shared/wedding-day'
import type { TemplateSurfaceProps } from '~/templates/types'
import {
  BotanicalSprig,
  bodyFont,
  Eyebrow,
  GoldRule,
  headingFont,
  labelFont,
  PrimaryButton,
  sectionHeadingClass,
} from '~/templates/voyage/components/primitives'

export function VoyageInvitation({ weddingData, path }: Readonly<TemplateSurfaceProps>) {
  const t = useTranslations('voyage.invitation')
  const locale = useLocale()
  const { website } = weddingData
  const weddingEvent = findWeddingDay(weddingData.events) ?? weddingData.events[0]
  const venue = weddingEvent?.venue ?? null
  const dateLabel = weddingData.date?.standardFormat ?? t('dateTba')
  const copy = weddingData.invitation

  return (
    <main className='flex min-h-screen w-full items-center justify-center bg-[#F7F3EC] px-6 py-20'>
      <div className='relative w-full max-w-xl overflow-hidden rounded-[3px] border border-[#DDD2C0] bg-[#FBF8F2] px-10 py-16 text-center'>
        <BotanicalSprig
          aria-hidden='true'
          className='pointer-events-none absolute top-1/2 -left-6 h-3/4 w-auto -translate-y-1/2 text-[#B15C41]/12'
        />
        <BotanicalSprig
          aria-hidden='true'
          className='pointer-events-none absolute top-1/2 -right-6 h-3/4 w-auto -translate-y-1/2 text-[#B15C41]/12'
        />
        <div className='relative flex flex-col items-center gap-5'>
          <Eyebrow>{copy?.preface ?? t('preface')}</Eyebrow>
          <h1 className={sectionHeadingClass}>
            {weddingData.brideFirstName} {weddingData.brideLastName}
          </h1>
          <span className={`${headingFont} text-[#B15C41] text-xl italic`}>{t('and')}</span>
          <h1 className={sectionHeadingClass}>
            {weddingData.groomFirstName} {weddingData.groomLastName}
          </h1>
          <p className={`${bodyFont} text-[#6F675D]`}>{copy?.invitationLine ?? t('line')}</p>
          {copy?.message ? (
            <p
              className={`${bodyFont} max-w-md whitespace-pre-line text-[#6F675D] text-sm leading-7`}
            >
              {copy.message}
            </p>
          ) : null}
          <GoldRule className='my-1' />
          <div className='flex flex-col gap-2'>
            <p className={`${labelFont} text-[#1D2320] text-[0.72rem] uppercase tracking-[0.28em]`}>
              {dateLabel}
            </p>
            {weddingEvent?.date ? (
              <p className={`${bodyFont} text-[#6F675D] text-sm`}>
                {new Intl.DateTimeFormat(toIntlLocale(locale), {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  timeZone: 'UTC',
                }).format(weddingEvent.date)}
                {weddingEvent.startTime
                  ? ` · ${formatEventTime(weddingEvent.startTime, locale)}`
                  : ''}
              </p>
            ) : null}
            {venue ? (
              <p
                className={`${labelFont} text-[#6F675D] text-[0.62rem] uppercase tracking-[0.22em]`}
              >
                {venue}
              </p>
            ) : null}
          </div>
          {website.isRsvpEnabled ? (
            <div className='pt-4'>
              <PrimaryButton href={`${path}/rsvp`}>{t('rsvp')}</PrimaryButton>
            </div>
          ) : (
            <Link
              href={path}
              className={`${labelFont} pt-2 text-[#B15C41] text-[0.64rem] uppercase tracking-[0.26em] underline-offset-4 hover:underline`}
            >
              {t('visitWebsite')}
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}
