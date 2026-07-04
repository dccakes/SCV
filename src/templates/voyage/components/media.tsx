/**
 * Voyage imagery: the cinematic hero backdrop (image + warm dark gradient, with
 * an elegant typographic fallback when no image is provided) and the "Favorite
 * Moments" fotowall — a full-width editorial photo wall whose tiles reveal a
 * caption on hover (and always show it on touch devices, which have no hover).
 */

import Image from 'next/image'
import type { ReactNode } from 'react'
import {
  BotanicalSprig,
  bodyFont,
  headingFont,
  labelFont,
} from '~/templates/voyage/components/primitives'

/**
 * Full-bleed hero background. Renders the provided image under a warm dark
 * gradient for legibility; with no image it falls back to a deep espresso wash
 * with a subtle botanical flourish so the hero never looks empty.
 */
export function HeroBackground({ url, children }: { url: string | null; children: ReactNode }) {
  return (
    <section className='relative isolate w-full overflow-hidden bg-[#1D2320] text-[#F7F3EC]'>
      {url ? (
        <Image
          src={url}
          alt=''
          fill
          priority
          sizes='100vw'
          className='-z-20 object-cover object-center'
        />
      ) : (
        <div
          aria-hidden='true'
          className='absolute inset-0 -z-20 bg-gradient-to-br from-[#2B302C] via-[#1D2320] to-[#2B302C]'
        >
          <div className='absolute inset-y-0 right-0 flex w-1/3 items-center justify-center opacity-[0.08]'>
            <BotanicalSprig className='h-[80%] w-auto text-[#D3BD8A]' />
          </div>
        </div>
      )}
      {/* Light warm scrim for text legibility, without obscuring the photo. */}
      <div
        aria-hidden='true'
        className='absolute inset-0 -z-10 bg-gradient-to-r from-[#0D110F]/55 via-[#0D110F]/25 to-transparent'
      />
      <div
        aria-hidden='true'
        className='absolute inset-0 -z-10 bg-gradient-to-t from-[#0D110F]/45 via-transparent to-[#0D110F]/20'
      />
      {children}
    </section>
  )
}

export type VoyageMoment = {
  imageUrl: string
  title?: string
  description?: string
}

/**
 * A full-width mosaic of favourite moments. Each tile fades in a soft dark
 * gradient and caption on hover; on touch screens (no hover) the caption stays
 * visible so the details are never lost. Renders nothing without images.
 */
export function VoyageMoments({ moments }: { moments: VoyageMoment[] }) {
  const shots = moments.filter((moment) => moment.imageUrl).slice(0, 6)
  if (shots.length === 0) {
    return null
  }
  const hasCaptions = shots.some((moment) => moment.title || moment.description)
  return (
    <section id='moments' className='w-full scroll-mt-24 bg-[#F7F3EC] pb-4'>
      <div className='mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 pt-16 pb-8 text-center sm:pt-20 lg:px-10'>
        <span className={`${labelFont} text-[#B15C41] text-[0.62rem] uppercase tracking-[0.42em]`}>
          A Few of Our Favorite Moments
        </span>
      </div>
      <div className='grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-6'>
        {shots.map((moment, index) => {
          const caption = moment.title || moment.description
          return (
            <figure
              key={moment.imageUrl}
              className={`group relative aspect-[3/4] overflow-hidden bg-[#EFE7DA] ${
                index === 0 ? 'col-span-2 sm:col-span-1' : ''
              }`}
            >
              <Image
                src={moment.imageUrl}
                alt={moment.title ?? ''}
                fill
                sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw'
                className='object-cover transition-transform duration-700 group-hover:scale-[1.06]'
              />
              {caption ? (
                <figcaption className='absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#0D110F]/85 via-[#0D110F]/20 to-transparent p-4 text-left opacity-100 transition-opacity duration-500 lg:opacity-0 lg:group-hover:opacity-100'>
                  {moment.title ? (
                    <span className={`${headingFont} text-[#F7F3EC] text-xl italic leading-tight`}>
                      {moment.title}
                    </span>
                  ) : null}
                  {moment.description ? (
                    <span
                      className={`${bodyFont} mt-1 text-[#F7F3EC]/80 text-[0.82rem] leading-snug`}
                    >
                      {moment.description}
                    </span>
                  ) : null}
                </figcaption>
              ) : (
                <span aria-hidden='true' className='absolute inset-0 bg-[#1D2320]/5' />
              )}
            </figure>
          )
        })}
      </div>
      {hasCaptions ? (
        <p
          className={`${labelFont} mx-auto hidden max-w-6xl px-6 pt-4 text-center text-[#6F675D]/70 text-[0.58rem] uppercase tracking-[0.24em] lg:block lg:px-10`}
        >
          Hover a photo to relive the moment
        </p>
      ) : null}
    </section>
  )
}
