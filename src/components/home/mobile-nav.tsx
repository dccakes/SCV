'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'

type NavLink = {
  href: string
  label: string
  external?: boolean
}

type MobileNavProps = {
  links: NavLink[]
}

export default function MobileNav({ links }: Readonly<MobileNavProps>) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!isOpen) {
      triggerRef.current?.focus()
      return
    }

    firstLinkRef.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setIsOpen(false)
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  return (
    <div className='md:hidden'>
      <button
        ref={triggerRef}
        type='button'
        aria-label='Open navigation menu'
        aria-controls={panelId}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className='inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm border border-border px-3 py-2 font-mono text-[0.62rem] text-foreground uppercase tracking-[.12em] transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      >
        Menu
      </button>

      {isOpen && (
        <div
          id={panelId}
          role='dialog'
          aria-modal='true'
          aria-label='Mobile navigation menu'
          className='absolute top-full right-0 left-0 border-border border-b bg-background/98 px-6 py-5 backdrop-blur-md'
        >
          <ul className='flex flex-col gap-3'>
            {links.map(({ href, label, external }, index) => (
              <li key={label}>
                <a
                  ref={index === 0 ? firstLinkRef : undefined}
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  onClick={() => setIsOpen(false)}
                  className='inline-flex min-h-11 items-center rounded-sm font-mono text-[0.68rem] text-foreground uppercase tracking-[.12em] transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                >
                  {label}
                </a>
              </li>
            ))}
            <li>
              <Link
                href='/auth/signin'
                onClick={() => setIsOpen(false)}
                className='mt-1 inline-flex min-h-11 items-center justify-center rounded-sm bg-foreground px-4 py-2 font-mono text-[0.68rem] text-background uppercase tracking-[.12em] transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              >
                Sign In
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
