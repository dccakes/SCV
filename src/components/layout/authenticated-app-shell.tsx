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
          <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>{children}</div>
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
              <EttaChat
                weddingId={weddingId}
                persona='planner'
                isConfigured={isEttaConfigured}
                onClose={toggleEttaPanel}
              />
            </aside>
          </div>
        )}
      </div>
    </AuthenticatedSidebarContext.Provider>
  )
}
