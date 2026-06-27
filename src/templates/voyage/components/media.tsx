/**
 * Voyage imagery: the cinematic hero backdrop (image + warm dark gradient, with
 * an elegant typographic fallback when no image is provided) and the full-width
 * editorial gallery strip.
 */

import Image from 'next/image'
import type { ReactNode } from 'react'
import { BotanicalSprig } from '~/templates/voyage/components/primitives'

/**
 * Full-bleed hero background. Renders the provided image under a warm dark
 * gradient for legibility; with no image it falls back to a deep espresso wash
 * with a subtle botanical flourish so the hero never looks empty.
 */
export function HeroBackground({ url, children }: { url: string | null; children: ReactNode }) {
  return (
    <section className='relative isolate w-full overflow-hidden bg-[#11110F] text-[#F8F1E7]'>
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
          className='absolute inset-0 -z-20 bg-gradient-to-br from-[#181611] via-[#11110F] to-[#1E1B16]'
        >
          <div className='absolute inset-y-0 right-0 flex w-1/3 items-center justify-center opacity-[0.08]'>
            <BotanicalSprig className='h-[80%] w-auto text-[#D1B879]' />
          </div>
        </div>
      )}
      {/* Warm dark gradient overlay for readability. */}
      <div
        aria-hidden='true'
        className='absolute inset-0 -z-10 bg-gradient-to-r from-[#0c0b09]/85 via-[#0c0b09]/55 to-[#0c0b09]/25'
      />
      <div
        aria-hidden='true'
        className='absolute inset-0 -z-10 bg-gradient-to-t from-[#0c0b09]/80 via-transparent to-[#0c0b09]/45'
      />
      {children}
    </section>
  )
}

/**
 * A thin full-width mosaic of photos. Renders nothing without images; the first
 * image spans wider to keep the strip editorial rather than a uniform grid.
 */
export function VoyageGalleryStrip({ urls }: { urls: string[] }) {
  if (urls.length === 0) {
    return null
  }
  const shots = urls.slice(0, 5)
  return (
    <section className='w-full'>
      <div className='grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-5'>
        {shots.map((url, index) => (
          <div
            key={url}
            className={`relative aspect-[3/4] overflow-hidden ${
              index === 0 ? 'col-span-2 sm:col-span-1' : ''
            }`}
          >
            <Image
              src={url}
              alt=''
              fill
              sizes='(max-width: 768px) 50vw, 20vw'
              className='object-cover transition-transform duration-700 hover:scale-[1.04]'
            />
            <span aria-hidden='true' className='absolute inset-0 bg-[#11110F]/5' />
          </div>
        ))}
      </div>
    </section>
  )
}
