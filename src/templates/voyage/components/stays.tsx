import Image from 'next/image'
import type { TravelSectionContent } from '~/server/domains/website-section/website-section.types'
import {
  BotanicalSprig,
  bodyFont,
  Eyebrow,
  headingFont,
  labelFont,
} from '~/templates/voyage/components/primitives'
import { Band, LinkifiedBlurb } from '~/templates/voyage/components/sections'

/** Booking instructions stay visible and URLs never depend on a blurb being present. */
export function VoyageStays({ content }: { content?: TravelSectionContent }) {
  return (
    <Band id='hotels' className='!py-10 sm:!py-14'>
      <div className='mb-10 max-w-3xl space-y-4'>
        <Eyebrow>Make yourself at home</Eyebrow>
        {content?.body ? (
          <LinkifiedBlurb
            text={content.body}
            className={`${bodyFont} whitespace-pre-line text-lg text-muted-foreground leading-8`}
          />
        ) : null}
        <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>
          Check each hotel’s instructions before booking to make sure you receive any wedding rates.
        </p>
      </div>
      <div className='space-y-8'>
        {content?.stays?.length ? (
          content.stays.map((stay, index) => (
            <article
              key={stay.name}
              id={`stay-${index}-${stay.name.replace(/\s+/g, '-').toLowerCase()}`}
              className='grid scroll-mt-24 overflow-hidden rounded-sm border border-border bg-card md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]'
            >
              <div className='relative aspect-[4/3] bg-secondary md:aspect-auto md:min-h-72'>
                {stay.imageUrl ? (
                  <Image
                    src={stay.imageUrl}
                    alt={stay.name}
                    fill
                    sizes='(max-width: 768px) 100vw, 33vw'
                    className='object-cover'
                  />
                ) : (
                  <BotanicalSprig className='absolute inset-0 m-auto h-40 w-24 text-primary/30' />
                )}
              </div>
              <div className='min-w-0 space-y-5 p-6 sm:p-9'>
                <h2 className={`${headingFont} text-3xl sm:text-4xl`}>{stay.name}</h2>
                {stay.description ? (
                  <p className={`${bodyFont} text-xl`}>{stay.description}</p>
                ) : null}
                {stay.url ? (
                  <a
                    href={stay.url}
                    {...(stay.url.startsWith('mailto:')
                      ? {}
                      : { target: '_blank', rel: 'noreferrer' })}
                    className={`${labelFont} inline-flex min-h-11 items-center rounded-sm bg-primary px-6 py-3 text-primary-foreground text-xs tracking-widest hover:opacity-90`}
                  >
                    {stay.buttonLabel?.trim() || 'Visit Website'}
                  </a>
                ) : (
                  <p className={`${bodyFont} text-muted-foreground`}>Booking link coming soon.</p>
                )}
                {stay.blurb ? (
                  <LinkifiedBlurb
                    text={stay.blurb}
                    className={`${bodyFont} whitespace-pre-line break-words text-lg text-muted-foreground leading-8`}
                  />
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <p className={`${bodyFont} text-lg text-muted-foreground`}>
            Our accommodation recommendations and booking details are coming soon.
          </p>
        )}
      </div>
    </Band>
  )
}
