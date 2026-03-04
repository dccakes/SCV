'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { signOut } from '~/lib/auth-client'

interface DashboardSidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  coupleName?: string
  weddingDate?: string
}

const PLANNING_NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: '◈' },
  { label: 'RSVPs', href: '/guest-list', icon: '◉' },
  { label: 'Guest List', href: '/guest-list', icon: '☷' },
  { label: 'Vendors', href: '/vendors', icon: '◐' },
  { label: 'Website', href: '/dashboard#website-editor', icon: '✦' },
]

const SETTINGS_NAV = [{ label: 'Settings', href: '/settings', icon: '⚙' }]

interface NavItemProps {
  label: string
  href: string
  icon: string
  isActive: boolean
  isCollapsed: boolean
  onClick?: () => void
}

function NavItem({ label, href, icon, isActive, isCollapsed, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex items-center border-l-2 py-2.5 font-mono text-xs uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-cream/80 focus-visible:ring-inset ${
        isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-4'
      } ${
        isActive
          ? 'border-primary bg-primary/15 text-sidebar-cream'
          : 'border-transparent text-sidebar-cream/65 hover:bg-white/[0.06] hover:text-sidebar-cream'
      }`}
    >
      <span className='flex-shrink-0 text-center text-base leading-none'>{icon}</span>
      {!isCollapsed && <span>{label}</span>}
    </Link>
  )
}

interface SidebarContentProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
  isActive: (href: string) => boolean
  coupleName?: string
  weddingDate?: string
  onNavClick?: () => void
  showCollapseToggle?: boolean
}

function SidebarContent({
  isCollapsed,
  onToggleCollapse,
  isActive,
  coupleName,
  weddingDate,
  onNavClick,
  showCollapseToggle = true,
}: SidebarContentProps) {
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
      {!isCollapsed && (coupleName ?? weddingDate) && (
        <div className='mx-3 mt-3 mb-1 rounded-md border border-white/15 bg-white/[0.07] px-3 py-2.5'>
          {coupleName && (
            <p className='mb-1 font-serif text-base text-sidebar-cream italic leading-tight'>
              {coupleName}
            </p>
          )}
          {weddingDate && (
            <p className='font-mono text-[0.6rem] text-primary uppercase tracking-widest'>
              {weddingDate}
            </p>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className='flex flex-1 flex-col gap-px py-3'>
        {!isCollapsed && (
          <p className='px-4 pt-2 pb-1 font-mono text-[0.55rem] text-sidebar-cream/80 uppercase tracking-[0.18em]'>
            Planning
          </p>
        )}
        {PLANNING_NAV.map((item) => (
          <NavItem
            key={item.href + item.label}
            {...item}
            isActive={isActive(item.href)}
            isCollapsed={isCollapsed}
            onClick={onNavClick}
          />
        ))}

        {!isCollapsed && (
          <p className='mt-2 px-4 pt-2 pb-1 font-mono text-[0.55rem] text-sidebar-cream/80 uppercase tracking-[0.18em]'>
            Settings
          </p>
        )}
        {SETTINGS_NAV.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            isActive={isActive(item.href)}
            isCollapsed={isCollapsed}
            onClick={onNavClick}
          />
        ))}
      </nav>

      {/* Bottom profile + sign out */}
      <div className='border-white/10 border-t p-3 flex flex-col gap-1.5'>
        <div
          className={`flex items-center gap-2 rounded-md px-2 py-1.5 font-mono text-sidebar-cream/70 text-xs ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-serif text-white text-xs italic'>
            W
          </span>
          {!isCollapsed && (
            <div>
              <div className='font-serif text-[0.75rem] text-sidebar-cream/90 leading-tight'>
                Couple
              </div>
              <div className='text-[0.55rem] text-sidebar-cream/55 uppercase tracking-wider'>
                Admin
              </div>
            </div>
          )}
        </div>
        <button
          type='button'
          onClick={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = '/' } } })}
          className={`flex items-center gap-2 rounded-sm border border-white/10 px-2 py-1.5 font-mono text-[0.58rem] text-sidebar-cream/45 uppercase tracking-widest transition-all hover:border-white/20 hover:text-sidebar-cream/75 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-cream/40 ${isCollapsed ? 'justify-center' : ''}`}
          title='Sign out'
        >
          <span className='text-[0.7rem]'>↪</span>
          {!isCollapsed && 'Sign out'}
        </button>
      </div>
    </div>
  )
}

export default function DashboardSidebar({
  isOpen,
  setIsOpen,
  coupleName,
  weddingDate,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  // Start collapsed=false for SSR safety; sync from localStorage on client after mount
  const [isCollapsed, setIsCollapsed] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

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

  return (
    <>
      {/* Desktop sidebar — collapses between w-14 and w-56 */}
      <aside
        className={`hidden h-full flex-shrink-0 flex-col overflow-hidden motion-safe:transition-[width] motion-safe:duration-200 lg:flex ${
          isCollapsed ? 'w-14' : 'w-56'
        }`}
      >
        <SidebarContent
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
          isActive={isActive}
          coupleName={coupleName}
          weddingDate={weddingDate}
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
            <SidebarContent
              isCollapsed={false}
              onToggleCollapse={() => {}}
              isActive={isActive}
              coupleName={coupleName}
              weddingDate={weddingDate}
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
