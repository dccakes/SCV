'use client'

import { createContext, useContext, useState } from 'react'

import DashboardSidebar from '~/app/_components/dashboard/dashboard-sidebar'

interface SidebarContextValue {
  openSidebar: () => void
}

const SidebarContext = createContext<SidebarContextValue>({ openSidebar: () => {} })

export function useSidebar(): SidebarContextValue {
  return useContext(SidebarContext)
}

interface DashboardShellProps {
  children: React.ReactNode
  coupleName?: string
  weddingDate?: string
}

export default function DashboardShell({ children, coupleName, weddingDate }: DashboardShellProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <SidebarContext.Provider value={{ openSidebar: () => setIsOpen(true) }}>
      <div className='flex h-screen overflow-hidden bg-background'>
        <DashboardSidebar
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          coupleName={coupleName}
          weddingDate={weddingDate}
        />
        <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>{children}</div>
      </div>
    </SidebarContext.Provider>
  )
}
