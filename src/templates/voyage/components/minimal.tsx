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
    <main className='flex min-h-screen flex-col items-center justify-center gap-7 bg-[#F7F3EA] px-6 text-center'>
      <Eyebrow>You are invited</Eyebrow>
      <h1 className={`${headingFont} font-light text-5xl text-[#1E1C18] italic sm:text-6xl`}>
        {coupleNames}
      </h1>
      <GoldRule />
      <p className={`${bodyFont} max-w-md text-[#746E64]`}>Our greatest adventure begins here.</p>
      {isRsvpEnabled ? (
        <Link
          href={`${path}/rsvp`}
          className={`${labelFont} rounded-[2px] bg-[#B89455] px-8 py-3.5 text-[#181611] text-[0.68rem] uppercase tracking-[0.28em] transition-colors hover:bg-[#A6824A]`}
        >
          RSVP
        </Link>
      ) : null}
    </main>
  )
}
