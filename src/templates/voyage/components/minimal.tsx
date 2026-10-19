import Link from 'next/link'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('voyage.minimal')
  const tNav = useTranslations('voyage.nav')
  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-7 bg-[#F7F3EC] px-6 text-center'>
      <Eyebrow>{t('invited')}</Eyebrow>
      <h1 className={`${headingFont} font-light text-5xl text-[#1D2320] italic sm:text-6xl`}>
        {coupleNames}
      </h1>
      <GoldRule />
      <p className={`${bodyFont} max-w-md text-[#6F675D]`}>{t('tagline')}</p>
      {isRsvpEnabled ? (
        <Link
          href={`${path}/rsvp`}
          className={`${labelFont} rounded-[2px] bg-[#B15C41] px-8 py-3.5 text-[#F7F3EC] text-[0.68rem] uppercase tracking-[0.28em] transition-colors hover:bg-[#92462F]`}
        >
          {tNav('rsvp')}
        </Link>
      ) : null}
    </main>
  )
}
