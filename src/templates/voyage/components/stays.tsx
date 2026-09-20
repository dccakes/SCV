import Image from 'next/image'
import type { TravelSectionContent } from '~/server/domains/website-section/website-section.types'
import {
  BotanicalSprig,
  bodyFont,
  Eyebrow,
  headingFont,
  labelFont,
  primaryButtonClass,
} from '~/templates/voyage/components/primitives'
import { Band, LinkifiedBlurb } from '~/templates/voyage/components/sections'

/** Consistent compact cards with booking actions visible and expandable full details. */
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
      <div className='grid items-start gap-8 md:grid-cols-2 lg:grid-cols-3'>
        {content?.stays?.length ? (
          content.stays.map((stay, index) => (
            <article
              key={stay.name}
              id={`stay-${index}-${stay.name.replace(/\s+/g, '-').toLowerCase()}`}
              className='scroll-mt-24 overflow-hidden rounded-[3px] border border-border bg-card'
            >
              <div className='relative aspect-[4/3] bg-secondary'>
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
              <div className='flex h-64 min-w-0 flex-col items-start gap-4 p-6'>
                <h2 className={`${headingFont} line-clamp-2 text-3xl`}>{stay.name}</h2>
                {stay.description ? (
                  <p className={`${bodyFont} line-clamp-2 text-lg text-muted-foreground leading-7`}>
                    {stay.description}
                  </p>
                ) : null}
                {stay.url ? (
                  <a
                    href={stay.url}
                    {...(stay.url.startsWith('mailto:')
                      ? {}
                      : { target: '_blank', rel: 'noreferrer' })}
                    className={`${primaryButtonClass} mt-auto max-w-full px-5`}
                  >
                    {stay.buttonLabel?.trim() || 'Visit Website'}
                  </a>
                ) : (
                  <p className={`${bodyFont} mt-auto text-muted-foreground`}>
                    Booking link coming soon.
                  </p>
                )}
              </div>
              {stay.blurb || stay.description ? (
                <details className='group border-border border-t px-6'>
                  <summary
                    className={`${labelFont} flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 text-[0.62rem] uppercase tracking-[0.2em] [&::-webkit-details-marker]:hidden`}
                  >
                    <span className='group-open:hidden'>View hotel details</span>
                    <span className='hidden group-open:inline'>Close hotel details</span>
                    <span aria-hidden='true' className='text-xl group-open:rotate-45'>
                      +
                    </span>
                  </summary>
                  <div className='space-y-4 pb-6'>
                    {stay.description ? (
                      <p className={`${bodyFont} text-lg leading-8`}>{stay.description}</p>
                    ) : null}
                    {stay.blurb ? (
                      <LinkifiedBlurb
                        text={stay.blurb}
                        className={`${bodyFont} whitespace-pre-line break-words text-lg text-muted-foreground leading-8`}
                      />
                    ) : null}
                  </div>
                </details>
              ) : (
                <div aria-hidden='true' className='h-14 border-border border-t' />
              )}
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
