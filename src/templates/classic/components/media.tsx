/**
 * Classic template imagery: the header/hero banner shown at the top of every
 * surface, and the couple photo gallery shown on the home page. Both adopt
 * Classic's restrained, editorial styling (full-bleed, soft framing).
 */

import Image from 'next/image'

export function ClassicHeaderImage({ url }: { url: string | null }) {
  if (!url) {
    return null
  }
  return (
    <div className='relative aspect-[3/1] w-full overflow-hidden'>
      <Image
        src={url}
        fill
        priority
        sizes='100vw'
        className='object-cover object-center'
        alt='Wedding header'
      />
    </div>
  )
}

export function ClassicCoupleGallery({ urls }: { urls: string[] }) {
  if (urls.length === 0) {
    return null
  }
  return (
    <section className='grid w-full max-w-4xl grid-cols-2 gap-3 px-6 sm:grid-cols-3'>
      {urls.map((url) => (
        <div key={url} className='relative aspect-square overflow-hidden'>
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
