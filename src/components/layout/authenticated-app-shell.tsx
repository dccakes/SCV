'use client'

import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { EttaChat } from '~/components/etta/EttaChat'
import SidebarNavFrame from '~/components/nav/sidebar-nav'

type AuthenticatedSidebarContextValue = {
  openSidebar: () => void
}

const AuthenticatedSidebarContext = createContext<AuthenticatedSidebarContextValue>({
  openSidebar: () => {},
})

export function useAuthenticatedSidebar(): AuthenticatedSidebarContextValue {
  return useContext(AuthenticatedSidebarContext)
}

type AuthenticatedAppShellProps = {
  children: ReactNode
  coupleName?: string
  weddingDate?: string
  weddingLocation?: string
  showEttaPanel?: boolean
  weddingId?: string
  isEttaConfigured?: boolean
}

export default function AuthenticatedAppShell(props: Readonly<AuthenticatedAppShellProps>) {
  const {
    children,
    coupleName,
    weddingDate,
    weddingLocation,
    showEttaPanel = false,
    weddingId,
    isEttaConfigured = false,
  } = props
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    document.body.classList.add('overflow-hidden')
    return () => document.body.classList.remove('overflow-hidden')
  }, [])

  return (
    <AuthenticatedSidebarContext.Provider value={{ openSidebar: () => setIsOpen(true) }}>
      <div className='flex h-screen overflow-hidden bg-background'>
        <SidebarNavFrame
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          coupleName={coupleName}
          weddingDate={weddingDate}
          weddingLocation={weddingLocation}
        />
        <div className='flex min-h-0 flex-1 overflow-hidden'>
          <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
            {/* TODO: Remove this floating trigger once mobile navigation is fully integrated in final layout. */}
            <button
              type='button'
              aria-label='Open sidebar'
              onClick={() => setIsOpen(true)}
              className='fixed bottom-4 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card/80 text-foreground/70 shadow-sm backdrop-blur-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2 lg:hidden'
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
            {children}
          </div>
          {showEttaPanel && weddingId && (
            <aside className='hidden w-80 flex-shrink-0 border-white/10 border-l lg:flex lg:flex-col'>
              <EttaChat weddingId={weddingId} persona='planner' isConfigured={isEttaConfigured} />
            </aside>
          )}
        </div>
      </div>
    </AuthenticatedSidebarContext.Provider>
  )
}
