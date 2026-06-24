import Link from 'next/link'
import type { TemplateSurfaceProps } from '~/templates/types'
import { HeroBackground } from '~/templates/voyage/components/media'
import {
  bodyFont,
  Eyebrow,
  GhostButtonOnDark,
  GoldRule,
  headingFont,
  labelFont,
} from '~/templates/voyage/components/primitives'

export function VoyageSaveTheDate({ weddingData, path }: Readonly<TemplateSurfaceProps>) {
  const { website } = weddingData
  const heroUrl = website.headerImageUrl ?? website.coverPhotoUrl ?? null
  const weddingEvent =
    weddingData.events.find((event) => event.name === 'Wedding Day') ?? weddingData.events[0]
  const venue = weddingEvent?.venue ?? null
  const dateLabel = weddingData.date?.standardFormat ?? 'Date to be announced'

  return (
    <main className='w-full'>
      <HeroBackground url={heroUrl}>
        <div className='mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 py-24 text-center text-[#F8F1E7]'>
          <Eyebrow className='text-[#D1B879]'>Save the Date</Eyebrow>
          <h1 className={`${headingFont} font-light text-5xl italic sm:text-7xl`}>
            {weddingData.groomFirstName}
            <span className='mx-3 text-[#D1B879] not-italic'>&amp;</span>
            {weddingData.brideFirstName}
          </h1>
          <GoldRule className='bg-[#D1B879]/70' />
          <p
            className={`${labelFont} text-[#F8F1E7]/90 text-[0.72rem] uppercase tracking-[0.32em]`}
          >
            {dateLabel}
          </p>
          {venue ? (
            <p
              className={`${labelFont} text-[#F8F1E7]/70 text-[0.66rem] uppercase tracking-[0.26em]`}
            >
              {venue}
            </p>
          ) : null}
          {weddingData.daysRemaining > 0 ? (
            <p className={`${bodyFont} text-[#F8F1E7]/70`}>
              {weddingData.daysRemaining} days to go
            </p>
          ) : null}
          <p className={`${bodyFont} text-[#F8F1E7]/70 italic`}>Formal invitation to follow.</p>
          <div className='pt-2'>
            <GhostButtonOnDark href={path}>Visit our website</GhostButtonOnDark>
          </div>
          {website.isRsvpEnabled ? (
            <Link
              href={`${path}/rsvp`}
              className={`${labelFont} text-[#D1B879] text-[0.66rem] uppercase tracking-[0.28em] underline-offset-4 hover:underline`}
            >
              RSVP
            </Link>
          ) : null}
        </div>
      </HeroBackground>
    </main>
  )
}
