/**
 * Voyage top navigation — a monogram lockup on the left, anchor links to the
 * page's enabled sections in the center, and an RSVP action on the right. It
 * overlays the cinematic hero, so it uses warm-ivory ink on the dark backdrop.
 *
 * On small screens the center links collapse into a pure-CSS `<details>` drawer
 * (no client JavaScript required) so the nav works in a server component.
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

const linkClass = `${labelFont} text-[#F7F3EC]/80 text-[0.6rem] uppercase tracking-[0.26em] transition-colors hover:text-[#D3BD8A]`

export function VoyageNavbar({ monogram, coupleNames, navItems, rsvpHref }: VoyageNavbarProps) {
  return (
    <nav
      aria-label='Wedding website'
      className='relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-6 lg:px-10'
    >
      <Link href='#top' className='flex flex-col items-start gap-0.5 text-[#F7F3EC]'>
        <span className='font-[family-name:var(--tpl-heading-font)] text-2xl tracking-[0.14em]'>
          {monogram}
        </span>
        <span
          className={`${labelFont} hidden text-[#F7F3EC]/85 text-[0.5rem] uppercase tracking-[0.32em] sm:block`}
        >
          {coupleNames}
        </span>
      </Link>

      {navItems.length > 0 ? (
        <ul className='hidden items-center gap-8 lg:flex'>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={linkClass}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <div className='flex items-center gap-3'>
        {rsvpHref ? (
          <Link
            href={rsvpHref}
            className={`${labelFont} rounded-[2px] bg-[#B15C41] px-6 py-2.5 text-[#F7F3EC] text-[0.6rem] uppercase tracking-[0.26em] transition-colors hover:bg-[#92462F]`}
          >
            RSVP
          </Link>
        ) : null}

        {navItems.length > 0 ? (
          <details className='group relative lg:hidden'>
            <summary
              aria-label='Open menu'
              className='flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-[2px] border border-[#F7F3EC]/30 text-[#F7F3EC] [&::-webkit-details-marker]:hidden'
            >
              <svg
                viewBox='0 0 24 24'
                aria-hidden='true'
                className='h-5 w-5'
                fill='none'
                stroke='currentColor'
                strokeWidth={1.2}
                strokeLinecap='round'
              >
                <path d='M4 7h16M4 12h16M4 17h16' className='group-open:hidden' />
                <path d='M6 6l12 12M18 6 6 18' className='hidden group-open:block' />
              </svg>
            </summary>
            <ul className='absolute right-0 z-30 mt-3 flex w-56 flex-col gap-1 rounded-[3px] border border-[#F7F3EC]/15 bg-[#1D2320]/95 p-4 backdrop-blur-sm'>
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${labelFont} block px-2 py-2.5 text-[#F7F3EC]/85 text-[0.62rem] uppercase tracking-[0.24em] transition-colors hover:text-[#D3BD8A]`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </nav>
  )
}
