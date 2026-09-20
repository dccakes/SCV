'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import {
  headingFont,
  labelFont,
  primaryButtonClass,
} from '~/templates/voyage/components/primitives'
import {
  explorePages,
  primaryPages,
  secondaryPages,
  type VoyageLocation,
  type VoyagePage,
  voyagePages,
} from '~/templates/voyage/site'

type Props = {
  monogram: string
  coupleNames: string
  path: string
  current: VoyageLocation
  rsvpEnabled: boolean
}
const linkClass = `${labelFont} flex min-h-11 items-center px-3 py-2 text-[0.62rem] uppercase tracking-[0.24em] transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary`

export function VoyageNavbar({ monogram, coupleNames, path, current, rsvpEnabled }: Props) {
  const [open, setOpen] = useState(false)
  const [dropdown, setDropdown] = useState<'explore' | 'more' | null>(null)
  const menuId = useId()
  const menuButton = useRef<HTMLButtonElement>(null)
  const header = useRef<HTMLElement>(null)

  useEffect(() => {
    function dismiss(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (open) menuButton.current?.focus()
      if (dropdown)
        header.current?.querySelector<HTMLButtonElement>('[aria-expanded="true"]')?.focus()
      setOpen(false)
      setDropdown(null)
    }
    function outside(event: PointerEvent) {
      if (!header.current?.contains(event.target as Node)) {
        setOpen(false)
        setDropdown(null)
      }
    }
    document.addEventListener('keydown', dismiss)
    document.addEventListener('pointerdown', outside)
    return () => {
      document.removeEventListener('keydown', dismiss)
      document.removeEventListener('pointerdown', outside)
    }
  }, [open, dropdown])

  const close = () => {
    setOpen(false)
    setDropdown(null)
  }
  function pageLink(page: VoyagePage) {
    return (
      <Link
        key={page}
        href={`${path}/${page}`}
        onClick={close}
        aria-current={current === page ? 'page' : undefined}
        className={`${linkClass} ${current === page ? 'font-semibold text-primary underline underline-offset-4' : ''}`}
      >
        {voyagePages[page].title}
      </Link>
    )
  }

  return (
    <header
      ref={header}
      className='sticky top-0 z-40 border-border border-b bg-background/95 text-foreground backdrop-blur-md'
    >
      <a
        href='#page-content'
        className='sr-only focus:not-sr-only focus:absolute focus:bg-background focus:p-4'
      >
        Skip to content
      </a>
      <div className='mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-3 lg:px-10'>
        <Link
          href={path}
          onClick={close}
          aria-label={`${coupleNames} — Home`}
          className='flex min-h-11 shrink-0 flex-col justify-center'
        >
          <span className={`${headingFont} text-2xl tracking-[0.14em]`}>{monogram}</span>
          <span
            className={`${labelFont} hidden text-[0.6rem] uppercase tracking-[0.18em] sm:block`}
          >
            {coupleNames}
          </span>
        </Link>
        <nav aria-label='Wedding navigation' className='hidden items-center xl:flex'>
          {primaryPages.map(pageLink)}
          {(['explore', 'more'] as const).map((group) => {
            const pages = group === 'explore' ? explorePages : secondaryPages
            return (
              <div key={group} className='relative'>
                <button
                  type='button'
                  aria-expanded={dropdown === group}
                  aria-controls={`${menuId}-${group}`}
                  onClick={() => setDropdown(dropdown === group ? null : group)}
                  className={`${linkClass} gap-2 ${pages.some((page) => page === current) ? 'text-primary' : ''}`}
                >
                  {group === 'explore' ? 'Things to Do' : 'More'} <span aria-hidden='true'>⌄</span>
                </button>
                {dropdown === group ? (
                  <div
                    id={`${menuId}-${group}`}
                    className='absolute top-full right-0 min-w-56 rounded-sm border border-border bg-background p-2 shadow-lg'
                  >
                    {pages.map(pageLink)}
                  </div>
                ) : null}
              </div>
            )
          })}
        </nav>
        <div className='flex items-center gap-2'>
          {rsvpEnabled ? (
            <Link
              href={`${path}/rsvp`}
              onClick={close}
              aria-current={current === 'rsvp' ? 'page' : undefined}
              className={`${primaryButtonClass} px-6`}
            >
              RSVP
            </Link>
          ) : null}
          <button
            ref={menuButton}
            type='button'
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen(!open)}
            className={`${linkClass} gap-2 rounded-[2px] border border-border xl:hidden`}
          >
            Menu <span aria-hidden='true'>{open ? '×' : '☰'}</span>
          </button>
        </div>
      </div>
      {open ? (
        <nav
          id={menuId}
          aria-label='Mobile wedding navigation'
          className='max-h-[calc(100dvh-5rem)] overflow-y-auto border-border border-t px-6 py-4 xl:hidden'
        >
          <Link
            href={path}
            onClick={close}
            className={linkClass}
            aria-current={current === 'home' ? 'page' : undefined}
          >
            Home
          </Link>
          {primaryPages.map(pageLink)}
          <p
            className={`${labelFont} mt-4 px-3 text-muted-foreground text-xs uppercase tracking-widest`}
          >
            Things to Do
          </p>
          {explorePages.map(pageLink)}
          <div className='mt-3 border-border border-t pt-3'>{secondaryPages.map(pageLink)}</div>
        </nav>
      ) : null}
    </header>
  )
}
