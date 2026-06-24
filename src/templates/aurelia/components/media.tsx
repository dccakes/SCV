/**
 * Aurelia template imagery: the header/hero banner shown at the top of every
 * surface, and the couple photo gallery shown on the home page. Both adopt
 * Aurelia's soft, rounded, bordered styling.
 */

import Image from 'next/image'

export function AureliaHeaderImage({ url }: { url: string | null }) {
  if (!url) {
    return null
  }
  return (
    <div className='relative h-64 w-full max-w-4xl overflow-hidden rounded-[28px] border border-border shadow-sm sm:h-80 md:h-96'>
      <Image
        src={url}
        fill
        priority
        sizes='(max-width: 768px) 100vw, 80vw'
        className='object-cover'
        alt='Wedding header'
      />
    </div>
  )
}

export function AureliaCoupleGallery({ urls }: { urls: string[] }) {
  if (urls.length === 0) {
    return null
  }
  return (
    <section className='grid w-full max-w-4xl gap-4 sm:grid-cols-3'>
      {urls.map((url) => (
        <div
          key={url}
          className='relative aspect-square overflow-hidden rounded-[20px] border border-border shadow-sm'
        >
          <Image
            src={url}
            fill
            sizes='(max-width: 768px) 50vw, 33vw'
            className='object-cover'
            alt='The couple'
          />
        </div>
      ))}
    </section>
  )
}
