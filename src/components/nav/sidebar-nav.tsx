'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import SidebarNavContent, { type SidebarSection } from '~/components/nav/sidebar-nav-content'
import SidebarUserAvatarButton from '~/components/nav/sidebar-user-avatar-button'
import WeddingChipCard from '~/components/nav/wedding-chip-card'
import { signOut } from '~/lib/auth-client'

const SIDEBAR_SECTIONS: readonly SidebarSection[] = [
  {
    title: 'Planning',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: '◈' },
      { label: 'RSVPs', href: '/guest-list', icon: '◉' },
      { label: 'Events', href: '/events', icon: '☷' },
      { label: 'Vendors', href: '/vendors', icon: '◐' },
    ],
  },
  {
    title: 'Guests',
    items: [
      { label: 'Guest List', href: '/guest-list', icon: '☷' },
      { label: 'Website', href: '/my-site', icon: '✦' },
    ],
  },
  {
    title: 'Settings',
    items: [{ label: 'Settings', href: '/settings', icon: '⚙' }],
  },
]

export type SidebarNavFrameProps = Readonly<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  coupleName?: string
  weddingDate?: string
  weddingLocation?: string
}>

type SidebarNavProps = Readonly<{
  isCollapsed: boolean
  onToggleCollapse: () => void
  isActive: (href: string) => boolean
  coupleName?: string
  weddingDate?: string
  weddingLocation?: string
  onSignOut: () => void
  onNavClick?: () => void
  showCollapseToggle?: boolean
}>

function SidebarNav({
  isCollapsed,
  onToggleCollapse,
  isActive,
  coupleName,
  weddingDate,
  weddingLocation,
  onSignOut,
  onNavClick,
  showCollapseToggle = true,
}: SidebarNavProps) {
  return (
    <div className='flex h-full flex-col bg-sidebar-ink'>
      {/* Header: logo + collapse toggle */}
      <div
        className={`flex items-center border-white/10 border-b py-4 ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        {!isCollapsed && (
          <div className='flex items-center gap-2'>
            <span className='font-medium font-mono text-sidebar-cream text-xs uppercase tracking-[0.2em]'>
              OSWP
            </span>
            <span className='mt-[-6px] h-1.5 w-1.5 rounded-full bg-primary' />
          </div>
        )}

        {showCollapseToggle && (
          <button
            type='button'
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isCollapsed}
            onClick={onToggleCollapse}
            className='flex h-11 w-11 items-center justify-center rounded-md text-sidebar-cream/55 transition-colors hover:bg-white/[0.08] hover:text-sidebar-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-cream/80 focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar-ink'
          >
            <svg
              aria-hidden='true'
              className='h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              strokeWidth={1.5}
            >
              {isCollapsed ? (
                /* chevron-right — click to expand */
                <path strokeLinecap='round' strokeLinejoin='round' d='M8.25 4.5l7.5 7.5-7.5 7.5' />
              ) : (
                /* chevron-left — click to collapse */
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M15.75 19.5L8.25 12l7.5-7.5'
                />
              )}
            </svg>
          </button>
        )}
      </div>

      {/* Wedding chip — hidden when collapsed */}
      {!isCollapsed && (coupleName ?? weddingDate ?? weddingLocation) && (
        <WeddingChipCard
          coupleName={coupleName}
          weddingDate={weddingDate}
          weddingLocation={weddingLocation}
        />
      )}

      <SidebarNavContent
        sections={SIDEBAR_SECTIONS}
        isCollapsed={isCollapsed}
        isActive={isActive}
        onNavClick={onNavClick}
      />

      <SidebarUserAvatarButton isCollapsed={isCollapsed} onSignOut={onSignOut} />
    </div>
  )
}

export default function SidebarNavFrame(props: SidebarNavFrameProps) {
  const { isOpen, setIsOpen, coupleName, weddingDate, weddingLocation } = props
  const pathname = usePathname()
  // Start collapsed=false for SSR safety; sync from localStorage on client after mount
  const [isCollapsed, setIsCollapsed] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const resolvedCoupleName = coupleName ?? 'Holly & Diego'
  const resolvedWeddingDate = weddingDate ?? '17 May 2027'
  const resolvedWeddingLocation = weddingLocation ?? 'Oaxaca, Mexico'

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed') === 'true'
    setIsCollapsed(saved)
  }, [])

  // Focus trap + Escape key handler when mobile drawer is open
  useEffect(() => {
    if (!isOpen) return

    closeButtonRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        return
      }
      if (e.key !== 'Tab') return

      const drawer = drawerRef.current
      if (!drawer) return

      const focusable = drawer.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, setIsOpen])

  const isActive = (href: string) => {
    if (href.includes('#')) return pathname === href.split('#')[0]
    return pathname.startsWith(href)
  }

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  const handleSignOut = () => {
    signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = '/'
        },
      },
    })
  }

  return (
    <>
      {/* Desktop sidebar — collapses between w-14 and w-56 */}
      <aside
        className={`hidden h-full flex-shrink-0 flex-col overflow-hidden motion-safe:transition-[width] motion-safe:duration-200 lg:flex ${
          isCollapsed ? 'w-14' : 'w-56'
        }`}
      >
        <SidebarNav
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
          isActive={isActive}
          coupleName={resolvedCoupleName}
          weddingDate={resolvedWeddingDate}
          weddingLocation={resolvedWeddingLocation}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* Mobile drawer — full-width overlay, never collapsed */}
      {isOpen && (
        <div
          ref={drawerRef}
          role='dialog'
          aria-modal='true'
          aria-label='Navigation menu'
          className='fixed inset-0 z-50 lg:hidden'
        >
          <div
            className='absolute inset-0 bg-black/60'
            onClick={() => setIsOpen(false)}
            aria-hidden='true'
          />
          <aside className='relative flex h-full w-full flex-col'>
            <SidebarNav
              isCollapsed={false}
              onToggleCollapse={() => {}}
              isActive={isActive}
              coupleName={resolvedCoupleName}
              weddingDate={resolvedWeddingDate}
              weddingLocation={resolvedWeddingLocation}
              onSignOut={handleSignOut}
              onNavClick={() => setIsOpen(false)}
              showCollapseToggle={false}
            />
            <button
              ref={closeButtonRef}
              type='button'
              aria-label='Close menu'
              onClick={() => setIsOpen(false)}
              className='absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-md text-sidebar-cream/50 transition-colors hover:bg-white/[0.06] hover:text-sidebar-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-cream/80 focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar-ink'
            >
              <svg
                aria-hidden='true'
                className='h-5 w-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                strokeWidth={1.5}
              >
                <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </aside>
        </div>
      )}
    </>
  )
}
