/**
 * Voyage top navigation — a monogram lockup on the left, anchor links to the
 * page's enabled sections in the center, and an RSVP action on the right. It
 * overlays the cinematic hero, so it uses warm-ivory ink on the dark backdrop.
 */

import Link from 'next/link'
import { labelFont } from '~/templates/voyage/components/primitives'

export type VoyageNavItem = {
  label: string
  /** Same-page anchor (e.g. `#destination`) or a sub-path. */
  href: string
}

type VoyageNavbarProps = {
  monogram: string
  coupleNames: string
  navItems: VoyageNavItem[]
  rsvpHref?: string
}

export function VoyageNavbar({ monogram, coupleNames, navItems, rsvpHref }: VoyageNavbarProps) {
  return (
    <nav
      aria-label='Wedding website'
      className='relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-6 lg:px-10'
    >
      <Link href='#top' className='flex items-center gap-3 text-[#F8F1E7]'>
        <span className='font-[family-name:var(--tpl-heading-font)] text-xl tracking-[0.18em]'>
          {monogram}
        </span>
        <span className='hidden h-7 w-px bg-[#F8F1E7]/30 sm:block' />
        <span
          className={`${labelFont} hidden text-[#F8F1E7]/85 text-[0.62rem] uppercase tracking-[0.34em] sm:block`}
        >
          {coupleNames}
        </span>
      </Link>

      <ul className='hidden items-center gap-8 lg:flex'>
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`${labelFont} text-[#F8F1E7]/80 text-[0.6rem] uppercase tracking-[0.26em] transition-colors hover:text-[#D1B879]`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      {rsvpHref ? (
        <Link
          href={rsvpHref}
          className={`${labelFont} rounded-[2px] bg-[#B89455] px-6 py-2.5 text-[#181611] text-[0.6rem] uppercase tracking-[0.26em] transition-colors hover:bg-[#A6824A]`}
        >
          RSVP
        </Link>
      ) : null}
    </nav>
  )
}
