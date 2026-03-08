'use client'

import { useEffect, useState } from 'react'

import { useAuthenticatedSidebar } from '@/components/layout/authenticated-app-shell'
import { ThemeToggle } from '~/components/theme-toggle'

type DashboardTopbarProps = {
  title?: string
  showManagementActions?: boolean
  onMenuToggle?: () => void
}

export default function DashboardTopbar(props: Readonly<DashboardTopbarProps>) {
  const { title = 'Dashboard', showManagementActions = true, onMenuToggle } = props
  const { openSidebar } = useAuthenticatedSidebar()
  const [today, setToday] = useState('')

  useEffect(() => {
    const formattedToday = new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date())

    setToday(formattedToday)
  }, [])

  return (
    <header className='flex h-14 flex-shrink-0 items-center justify-between border-border/80 border-b bg-card/70 px-4 backdrop-blur-sm lg:px-6'>
      <div className='flex items-center gap-3'>
        {/* Mobile menu trigger — 44×44 touch target */}
        <button
          type='button'
          aria-label='Open sidebar'
          onClick={onMenuToggle ?? openSidebar}
          className='flex h-11 w-11 items-center justify-center rounded-md text-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2 lg:hidden'
        >
          <svg
            aria-hidden='true'
            className='h-5 w-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
            />
          </svg>
        </button>

        <div className='flex items-baseline gap-3'>
          <h1 className='font-serif text-foreground text-xl'>{title}</h1>
          <span className='hidden font-mono text-[0.62rem] text-foreground/50 tracking-wider sm:block'>
            {today}
          </span>
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <ThemeToggle />
        {showManagementActions && (
          <>
            <button
              type='button'
              aria-label='Export guest list'
              className='hidden min-h-[44px] items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 font-mono text-[0.62rem] text-foreground/70 uppercase tracking-widest transition-colors hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2 sm:flex'
            >
              Export guest list
            </button>
            <button
              type='button'
              aria-label='Send update'
              className='hidden min-h-[44px] items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 font-mono text-[0.62rem] text-foreground/70 uppercase tracking-widest transition-colors hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2 md:flex'
            >
              Send update
            </button>
            <button
              type='button'
              aria-label='Add task'
              className='flex min-h-[44px] items-center gap-1.5 rounded-sm bg-foreground px-3 py-1.5 font-mono text-[0.62rem] text-background uppercase tracking-widest transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2'
            >
              + Add task
            </button>
          </>
        )}
      </div>
    </header>
  )
}
