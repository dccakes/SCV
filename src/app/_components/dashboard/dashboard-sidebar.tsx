'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

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
      className={`flex items-center gap-2.5 border-l-2 px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all ${
        isActive
          ? 'border-primary bg-primary/10 text-sidebar-cream'
          : 'border-transparent text-sidebar-cream/50 hover:bg-white/[0.04] hover:text-sidebar-cream/85'
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

  // Listen for open-sidebar events dispatched by DashboardTopbar's hamburger
  useEffect(() => {
    const handler = () => setIsOpen(true)
    window.addEventListener('dashboard:open-sidebar', handler)
    return () => window.removeEventListener('dashboard:open-sidebar', handler)
  }, [])

  const isActive = (href: string) => {
    if (href.includes('#')) return pathname === href.split('#')[0]
    return pathname.startsWith(href)
  }

  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <div className='flex h-full flex-col bg-sidebar-ink'>
      {/* Logo */}
      <div className='flex items-center gap-2 border-white/[0.06] border-b px-5 py-4'>
        <span className='font-medium font-mono text-sidebar-cream text-xs uppercase tracking-[0.2em]'>
          OSWP
        </span>
        <span className='mt-[-6px] h-1.5 w-1.5 rounded-full bg-primary' />
      </div>

      {/* Wedding chip */}
      {(coupleName ?? weddingDate) && (
        <div className='mx-3 mt-3 mb-1 rounded-md border border-white/[0.08] bg-white/[0.05] px-3 py-2.5'>
          {coupleName && (
            <p className='mb-1 font-serif text-base text-sidebar-cream/95 italic leading-tight'>
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
        <p className='px-4 pt-2 pb-1 font-mono text-[0.55rem] text-sidebar-cream/25 uppercase tracking-[0.18em]'>
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

        <p className='mt-2 px-4 pt-2 pb-1 font-mono text-[0.55rem] text-sidebar-cream/25 uppercase tracking-[0.18em]'>
          Settings
        </p>
        {SETTINGS_NAV.map((item) => (
          <NavItem key={item.href} {...item} isActive={isActive(item.href)} onClick={onNavClick} />
        ))}
      </nav>

      {/* Bottom spacer */}
      <div className='border-white/[0.06] border-t p-3'>
        <div className='flex items-center gap-2 rounded-md px-2 py-1.5 font-mono text-sidebar-cream/60 text-xs'>
          <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-serif text-white text-xs italic'>
            W
          </span>
          <div>
            <div className='font-serif text-[0.75rem] text-sidebar-cream/80 leading-tight'>
              Couple
            </div>
            <div className='text-[0.55rem] text-sidebar-cream/30 uppercase tracking-wider'>
              Admin
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className='hidden w-56 flex-shrink-0 flex-col overflow-hidden lg:flex'>
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
              <svg
                aria-hidden='true'
                className='h-4 w-4'
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
