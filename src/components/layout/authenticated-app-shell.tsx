'use client'

import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
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
  currentUserFirstName?: string
  currentUserInitials?: string
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
    currentUserFirstName,
    currentUserInitials,
    weddingDate,
    weddingLocation,
    showEttaPanel = false,
    weddingId,
    isEttaConfigured = false,
  } = props
  const [isOpen, setIsOpen] = useState(false)
  const [isEttaPanelOpen, setIsEttaPanelOpen] = useState(showEttaPanel)

  useEffect(() => {
    document.body.classList.add('overflow-hidden')
    return () => document.body.classList.remove('overflow-hidden')
  }, [])

  useEffect(() => {
    if (!showEttaPanel) {
      setIsEttaPanelOpen(false)
      return
    }

    const saved = localStorage.getItem('etta-panel-open')
    setIsEttaPanelOpen(saved ? saved === 'true' : true)
  }, [showEttaPanel])

  const toggleEttaPanel = useCallback(() => {
    setIsEttaPanelOpen((prev) => {
      const next = !prev
      localStorage.setItem('etta-panel-open', String(next))
      return next
    })
  }, [])

  // Close mobile Etta overlay on Escape key
  useEffect(() => {
    if (!isEttaPanelOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && window.matchMedia('(max-width: 1023px)').matches) {
        toggleEttaPanel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isEttaPanelOpen, toggleEttaPanel])

  return (
    <AuthenticatedSidebarContext.Provider value={{ openSidebar: () => setIsOpen(true) }}>
      <div className='flex h-screen overflow-hidden bg-background'>
        <SidebarNavFrame
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          coupleName={coupleName}
          ettaPanelOpen={isEttaPanelOpen}
          onToggleEttaPanel={showEttaPanel ? toggleEttaPanel : undefined}
          userFirstName={currentUserFirstName}
          userInitials={currentUserInitials}
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
          {showEttaPanel && weddingId && isEttaPanelOpen && (
            <aside className='hidden w-80 flex-shrink-0 border-white/10 border-l lg:flex lg:flex-col'>
              <EttaChat weddingId={weddingId} persona='planner' isConfigured={isEttaConfigured} />
            </aside>
          )}
        </div>

        {/* Mobile Etta overlay — full-screen drawer from right */}
        {showEttaPanel && weddingId && isEttaPanelOpen && (
          <div
            className='fixed inset-0 z-50 lg:hidden'
            role='dialog'
            aria-modal='true'
            aria-label='Etta AI assistant'
          >
            <div
              className='absolute inset-0 bg-black/60'
              onClick={toggleEttaPanel}
              aria-hidden='true'
            />
            <aside className='relative ml-auto flex h-full w-full max-w-sm flex-col overflow-hidden'>
              <button
                type='button'
                aria-label='Close Etta'
                onClick={toggleEttaPanel}
                className='absolute top-2 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-md text-sidebar-cream/50 transition-colors hover:bg-white/[0.06] hover:text-sidebar-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-cream/80 focus-visible:ring-offset-1 focus-visible:ring-offset-etta-ink'
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
              <EttaChat weddingId={weddingId} persona='planner' isConfigured={isEttaConfigured} />
            </aside>
          </div>
        )}
      </div>
    </AuthenticatedSidebarContext.Provider>
  )
}
