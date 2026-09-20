import Image from 'next/image'
import type { TravelSectionContent } from '~/server/domains/website-section/website-section.types'
import {
  BotanicalSprig,
  bodyFont,
  Eyebrow,
  headingFont,
  primaryButtonClass,
} from '~/templates/voyage/components/primitives'
import { Band, LinkifiedBlurb } from '~/templates/voyage/components/sections'
import { VoyageStayDetails } from '~/templates/voyage/components/stay-details'

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
      <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
        {content?.stays?.length ? (
          content.stays.map((stay, index) => (
            <article
              key={stay.name}
              id={`stay-${index}-${stay.name.replace(/\s+/g, '-').toLowerCase()}`}
              className='grid h-[36rem] min-w-0 scroll-mt-24 grid-rows-[14rem_minmax(0,1fr)_3.5rem] overflow-hidden rounded-[3px] border border-border bg-card'
            >
              <div className='relative min-w-0 bg-secondary'>
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
              <div className='flex min-h-0 min-w-0 flex-col items-start gap-4 overflow-hidden p-6'>
                <h2 className={`${headingFont} line-clamp-2 shrink-0 break-words text-3xl`}>
                  {stay.name}
                </h2>
                {stay.description ? (
                  <p
                    className={`${bodyFont} line-clamp-2 shrink-0 break-words text-lg text-muted-foreground leading-7`}
                  >
                    {stay.description}
                  </p>
                ) : null}
                {stay.url ? (
                  <a
                    href={stay.url}
                    {...(stay.url.startsWith('mailto:')
                      ? {}
                      : { target: '_blank', rel: 'noreferrer' })}
                    className={`${primaryButtonClass} mt-auto max-w-full shrink-0 px-5`}
                  >
                    <span className='line-clamp-2 break-words'>
                      {stay.buttonLabel?.trim() || 'Visit Website'}
                    </span>
                  </a>
                ) : (
                  <p className={`${bodyFont} mt-auto text-muted-foreground`}>
                    Booking link coming soon.
                  </p>
                )}
              </div>
              <VoyageStayDetails name={stay.name}>
                <div className='space-y-5'>
                  {stay.description ? (
                    <p className={`${bodyFont} break-words text-lg leading-8`}>
                      {stay.description}
                    </p>
                  ) : null}
                  {stay.blurb ? (
                    <LinkifiedBlurb
                      text={stay.blurb}
                      className={`${bodyFont} whitespace-pre-line break-words text-lg text-muted-foreground leading-8`}
                    />
                  ) : null}
                  {stay.url ? (
                    <a
                      href={stay.url}
                      {...(stay.url.startsWith('mailto:')
                        ? {}
                        : { target: '_blank', rel: 'noreferrer' })}
                      className={`${primaryButtonClass} max-w-full text-center [overflow-wrap:anywhere]`}
                    >
                      {stay.buttonLabel?.trim() || 'Visit Website'}
                    </a>
                  ) : (
                    <p className={`${bodyFont} text-muted-foreground`}>Booking link coming soon.</p>
                  )}
                </div>
              </VoyageStayDetails>
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
