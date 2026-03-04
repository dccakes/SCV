'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface DashboardSidebarProps {
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
  onClick?: () => void
}

function NavItem({ label, href, icon, isActive, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-4 py-2 text-xs uppercase tracking-widest font-mono transition-all border-l-2 ${
        isActive
          ? 'border-primary bg-primary/10 text-sidebar-cream'
          : 'border-transparent text-sidebar-cream/50 hover:text-sidebar-cream/85 hover:bg-white/[0.04]'
      }`}
    >
      <span className='w-4 text-center text-sm'>{icon}</span>
      {label}
    </Link>
  )
}

export default function DashboardSidebar({ coupleName, weddingDate }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const isActive = (href: string) => {
    if (href.includes('#')) return pathname === href.split('#')[0]
    return pathname.startsWith(href)
  }

  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <div className='flex h-full flex-col bg-sidebar-ink'>
      {/* Logo */}
      <div className='flex items-center gap-2 border-b border-white/[0.06] px-5 py-4'>
        <span className='font-mono text-xs font-medium uppercase tracking-[0.2em] text-sidebar-cream'>
          OSWP
        </span>
        <span className='mt-[-6px] h-1.5 w-1.5 rounded-full bg-primary' />
      </div>

      {/* Wedding chip */}
      {(coupleName ?? weddingDate) && (
        <div className='mx-3 mt-3 mb-1 rounded-md border border-white/[0.08] bg-white/[0.05] px-3 py-2.5'>
          {coupleName && (
            <p className='font-serif text-base italic text-sidebar-cream/95 leading-tight mb-1'>
              {coupleName}
            </p>
          )}
          {weddingDate && (
            <p className='font-mono text-[0.6rem] uppercase tracking-widest text-primary'>
              {weddingDate}
            </p>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className='flex flex-1 flex-col gap-px py-3'>
        <p className='px-4 pt-2 pb-1 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-sidebar-cream/25'>
          Planning
        </p>
        {PLANNING_NAV.map((item) => (
          <NavItem
            key={item.href + item.label}
            {...item}
            isActive={isActive(item.href)}
            onClick={onNavClick}
          />
        ))}

        <p className='mt-2 px-4 pt-2 pb-1 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-sidebar-cream/25'>
          Settings
        </p>
        {SETTINGS_NAV.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            isActive={isActive(item.href)}
            onClick={onNavClick}
          />
        ))}
      </nav>

      {/* Bottom spacer */}
      <div className='border-t border-white/[0.06] p-3'>
        <div className='flex items-center gap-2 rounded-md px-2 py-1.5 text-sidebar-cream/60 text-xs font-mono'>
          <span className='h-6 w-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-serif italic flex-shrink-0'>
            W
          </span>
          <div>
            <div className='text-sidebar-cream/80 text-[0.75rem] font-serif leading-tight'>
              Couple
            </div>
            <div className='text-sidebar-cream/30 text-[0.55rem] uppercase tracking-wider'>
              Admin
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger trigger — rendered outside sidebar, used by topbar */}
      <button
        type='button'
        aria-label='Open menu'
        onClick={() => setIsOpen(true)}
        className='fixed top-3.5 left-3.5 z-40 flex h-8 w-8 items-center justify-center rounded-md text-foreground lg:hidden'
      >
        <svg
          className='h-5 w-5'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          strokeWidth={1.5}
        >
          <path strokeLinecap='round' strokeLinejoin='round' d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5' />
        </svg>
      </button>

      {/* Desktop sidebar */}
      <aside className='hidden lg:flex w-56 flex-shrink-0 flex-col overflow-hidden'>
        <SidebarContent />
      </aside>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div className='fixed inset-0 z-50 lg:hidden'>
          <div
            className='absolute inset-0 bg-black/50'
            onClick={() => setIsOpen(false)}
            aria-hidden='true'
          />
          <aside className='relative flex h-full w-64 flex-col'>
            <SidebarContent onNavClick={() => setIsOpen(false)} />
            <button
              type='button'
              aria-label='Close menu'
              onClick={() => setIsOpen(false)}
              className='absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-md text-sidebar-cream/60 hover:text-sidebar-cream'
            >
              <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth={1.5}>
                <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </aside>
        </div>
      )}
    </>
  )
}
