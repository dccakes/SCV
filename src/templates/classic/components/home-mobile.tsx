import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ClassicCoupleGallery, ClassicHeaderImage } from '~/templates/classic/components/media'
import { ClassicNavbar } from '~/templates/classic/components/navbar'
import { ClassicSections } from '~/templates/classic/components/sections'
import { useTemplateDates } from '~/templates/shared/dates'
import type { TemplateSurfaceProps } from '~/templates/types'

export function ClassicHomeMobile({
  weddingData,
  path,
  introText,
}: Readonly<TemplateSurfaceProps>) {
  const t = useTranslations('templateShared')
  const tClassic = useTranslations('classic')
  const dates = useTemplateDates()
  const { website } = weddingData

  return (
    <main className='flex flex-col items-center justify-center gap-20 pb-24 text-center text-zinc-500 tracking-widest'>
      <ClassicHeaderImage url={website.headerImageUrl} />
      <div className='text-center'>
        <h1 className='my-5 font-medium text-6xl tracking-widest'>
          {weddingData.brideFirstName} & {weddingData.groomFirstName}
        </h1>
        <p className='text-lg'>{dates.weddingDate(weddingData.date) ?? t('dateToBeAnnounced')}</p>
        {weddingData.daysRemaining > 0 && (
          <p className='text-lg'>{tClassic('daysToGo', { count: weddingData.daysRemaining })}</p>
        )}
        {website.isRsvpEnabled && (
          <Link
            href={`${path}/rsvp`}
            className='mt-5 inline-block rounded-sm bg-primary px-6 py-3 text-primary-foreground tracking-widest hover:bg-pink-500 hover:underline'
          >
            {t('rsvp')}
          </Link>
        )}
      </div>

      {website.coverPhotoUrl && (
        <div className='relative h-80 w-full px-10'>
          <Image
            src={website.coverPhotoUrl}
            fill
            sizes='100vw'
            priority
            className='object-contain'
            alt={t('images.cover')}
          />
        </div>
      )}

      {introText ? (
        <section className='max-w-2xl text-balance px-6 text-lg leading-8 tracking-normal'>
          <p>{introText}</p>
        </section>
      ) : null}

      <ClassicCoupleGallery urls={website.coupleImageUrls} />

      {weddingData.events.map((event) => (
        <div key={event.id} className='flex flex-col gap-2'>
          <h3 className='text-4xl tracking-widest'>{event.name.toLowerCase()}</h3>
          {!!event.date && (
            <span className='font-thin text-2xl'>{dates.eventDate(event.date)}</span>
          )}
          {!!event.startTime && (
            <span className='font-thin text-2xl'>
              {event.startTime}
              {!!event.endTime && ` - ${event.endTime}`}
            </span>
          )}
        </div>
      ))}

      <ClassicSections sections={weddingData.sections} />

      <ClassicNavbar path={path} isRsvpEnabled={website.isRsvpEnabled} />

      <div className='text-center'>
        <h2 className='border-black border-b px-5 pb-6 text-6xl'>
          {weddingData.brideFirstName?.[0] ?? t('initials.bride')} &{' '}
          {weddingData.groomFirstName?.[0] ?? t('initials.groom')}
        </h2>
        <p className='mt-4 text-lg tracking-widest'>
          {dates.weddingDateNumeric(weddingData.date) ?? t('dateToBeAnnounced')}
        </p>
      </div>
    </main>
  )
}
