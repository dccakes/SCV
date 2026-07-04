import Link from 'next/link'
import { formatDateStandard } from '~/app/utils/helpers'
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
  const { website } = weddingData
  const weddingEvent =
    weddingData.events.find((event) => event.name === 'Wedding Day') ?? weddingData.events[0]
  const venue = weddingEvent?.venue ?? null
  const dateLabel = weddingData.date?.standardFormat ?? 'Date to be announced'
  const copy = weddingData.invitation

  return (
    <main className='flex min-h-screen w-full items-center justify-center bg-[#F7F3EA] px-6 py-20'>
      <div className='relative w-full max-w-xl overflow-hidden rounded-[3px] border border-[#DED4C4] bg-[#FBF8F1] px-10 py-16 text-center'>
        <BotanicalSprig
          aria-hidden='true'
          className='pointer-events-none absolute top-1/2 -left-6 h-3/4 w-auto -translate-y-1/2 text-[#B89455]/12'
        />
        <BotanicalSprig
          aria-hidden='true'
          className='pointer-events-none absolute top-1/2 -right-6 h-3/4 w-auto -translate-y-1/2 text-[#B89455]/12'
        />
        <div className='relative flex flex-col items-center gap-5'>
          <Eyebrow>{copy?.preface ?? 'Together with their families'}</Eyebrow>
          <h1 className={sectionHeadingClass}>
            {weddingData.brideFirstName} {weddingData.brideLastName}
          </h1>
          <span className={`${headingFont} text-[#B89455] text-xl italic`}>and</span>
          <h1 className={sectionHeadingClass}>
            {weddingData.groomFirstName} {weddingData.groomLastName}
          </h1>
          <p className={`${bodyFont} text-[#746E64]`}>
            {copy?.invitationLine ?? 'request the pleasure of your company'}
          </p>
          {copy?.message ? (
            <p
              className={`${bodyFont} max-w-md whitespace-pre-line text-[#746E64] text-sm leading-7`}
            >
              {copy.message}
            </p>
          ) : null}
          <GoldRule className='my-1' />
          <div className='flex flex-col gap-2'>
            <p className={`${labelFont} text-[#1E1C18] text-[0.72rem] uppercase tracking-[0.28em]`}>
              {dateLabel}
            </p>
            {weddingEvent?.date ? (
              <p className={`${bodyFont} text-[#746E64] text-sm`}>
                {formatDateStandard(weddingEvent.date)}
                {weddingEvent.startTime ? ` · ${weddingEvent.startTime}` : ''}
              </p>
            ) : null}
            {venue ? (
              <p
                className={`${labelFont} text-[#746E64] text-[0.62rem] uppercase tracking-[0.22em]`}
              >
                {venue}
              </p>
            ) : null}
          </div>
          {website.isRsvpEnabled ? (
            <div className='pt-4'>
              <PrimaryButton href={`${path}/rsvp`}>RSVP</PrimaryButton>
            </div>
          ) : (
            <Link
              href={path}
              className={`${labelFont} pt-2 text-[#B89455] text-[0.64rem] uppercase tracking-[0.26em] underline-offset-4 hover:underline`}
            >
              Visit our website
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}
