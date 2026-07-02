import Link from 'next/link'
import type { TemplateMinimalProps } from '~/templates/types'
import {
  bodyFont,
  Eyebrow,
  GoldRule,
  headingFont,
  labelFont,
} from '~/templates/voyage/components/primitives'

export function VoyageMinimal({
  coupleNames,
  isRsvpEnabled,
  path,
}: Readonly<TemplateMinimalProps>) {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-7 bg-[#F7F3EC] px-6 text-center'>
      <Eyebrow>You are invited</Eyebrow>
      <h1 className={`${headingFont} font-light text-5xl text-[#1D2320] italic sm:text-6xl`}>
        {coupleNames}
      </h1>
      <GoldRule />
      <p className={`${bodyFont} max-w-md text-[#6F675D]`}>Our greatest adventure begins here.</p>
      {isRsvpEnabled ? (
        <Link
          href={`${path}/rsvp`}
          className={`${labelFont} rounded-[2px] bg-[#B9965B] px-8 py-3.5 text-[#1D2320] text-[0.68rem] uppercase tracking-[0.28em] transition-colors hover:bg-[#8A6A3E]`}
        >
          RSVP
        </Link>
      ) : null}
    </main>
  )
}
