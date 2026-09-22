import Link from 'next/link'
import type { ReactNode } from 'react'
import type { WeddingPageData } from '~/server/domains/website/website.types'
import { Decor } from '~/templates/voyage/components/decor'
import { VoyageNavbar } from '~/templates/voyage/components/navbar'
import {
  bodyFont,
  HeartRule,
  headingFont,
  labelFont,
  scriptFont,
} from '~/templates/voyage/components/primitives'
import { coupleIdentity, type VoyageLocation, voyagePages } from '~/templates/voyage/site'

export function VoyageSiteShell({
  weddingData,
  path,
  current,
  children,
}: {
  weddingData: WeddingPageData
  path: string
  current: VoyageLocation
  children: ReactNode
}) {
  const identity = coupleIdentity(weddingData)
  return (
    <div className='relative min-h-screen bg-background text-foreground'>
      <VoyageNavbar
        {...identity}
        path={path}
        current={current}
        rsvpEnabled={weddingData.website.isRsvpEnabled}
      />
      <div id='page-content' tabIndex={-1} className='scroll-mt-24 focus:outline-none'>
        {children}
      </div>
      <footer className='relative overflow-hidden border-border border-t bg-card px-6 py-14 lg:px-10'>
        <Decor
          name='floralBranch'
          className='pointer-events-none absolute -right-8 bottom-0 hidden h-48 w-auto opacity-50 lg:block'
        />
        <div className='relative mx-auto flex max-w-6xl flex-col items-center gap-6 text-center'>
          <Link href={path} className={`${headingFont} text-3xl`}>
            {identity.coupleNames}
          </Link>
          <HeartRule />
          <nav
            aria-label='Footer navigation'
            className='flex max-w-3xl flex-wrap justify-center gap-x-5 gap-y-1'
          >
            <Link
              href={path}
              className={`${labelFont} inline-flex min-h-11 items-center text-[0.62rem] uppercase tracking-[0.2em] hover:text-primary`}
            >
              Home
            </Link>
            {Object.entries(voyagePages).map(([page, { title }]) => (
              <Link
                key={page}
                href={`${path}/${page}`}
                className={`${labelFont} inline-flex min-h-11 items-center text-[0.62rem] uppercase tracking-[0.2em] hover:text-primary`}
              >
                {title}
              </Link>
            ))}
            {weddingData.website.isRsvpEnabled ? (
              <Link
                href={`${path}/rsvp`}
                className={`${labelFont} inline-flex min-h-11 items-center text-primary text-xs`}
              >
                RSVP
              </Link>
            ) : null}
          </nav>
          <p className={`${scriptFont} text-3xl text-primary`}>
            Thank you for being part of our beginning
          </p>
        </div>
      </footer>
    </div>
  )
}

export function VoyagePageHeading({
  title,
  description,
  path,
}: {
  title: string
  description: string
  path: string
}) {
  return (
    <div className='relative overflow-hidden border-border border-b bg-background px-6 py-8 text-center sm:py-12'>
      <Decor
        name='floralCorner'
        className='pointer-events-none absolute top-0 -right-8 hidden h-56 w-auto opacity-60 lg:block'
      />
      <div className='relative mx-auto flex max-w-3xl flex-col items-center gap-3'>
        <Link
          href={path}
          className={`${labelFont} inline-flex min-h-11 items-center text-[0.62rem] text-muted-foreground uppercase tracking-[0.2em] hover:text-primary`}
        >
          ← Home
        </Link>

        <h1 className={`${headingFont} font-light text-4xl italic sm:text-5xl`}>{title}</h1>
        <p className={`${bodyFont} text-lg text-muted-foreground leading-8`}>{description}</p>
        <HeartRule />
      </div>
    </div>
  )
}
