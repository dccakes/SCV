'use client'

import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'

import SidebarNavFrame from '~/components/nav/sidebar-nav'
import EttaPanel from '@/app/_components/old_dashboard/etta-panel'

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
  showEttaPanel?: boolean
}

export default function AuthenticatedAppShell(props: Readonly<AuthenticatedAppShellProps>) {
  const { children, coupleName, weddingDate, showEttaPanel = false } = props
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
        />
        <div className='flex min-h-0 flex-1 overflow-hidden'>
          <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>{children}</div>
          {showEttaPanel && <EttaPanel />}
        </div>
      </div>
    </AuthenticatedSidebarContext.Provider>
  )
}
