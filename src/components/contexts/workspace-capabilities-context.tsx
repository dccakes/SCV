'use client'

import { createContext, type ReactNode, useContext } from 'react'

type WorkspaceCapabilitiesContextValue = {
  canEditPlanning: boolean
}

// Defaults to editable so components rendered outside the authenticated shell (tests, public
// pages) behave as before. The server still enforces permissions on every mutation; this
// context only decides whether write controls are shown.
const WorkspaceCapabilitiesContext = createContext<WorkspaceCapabilitiesContextValue>({
  canEditPlanning: true,
})

type WorkspaceCapabilitiesProviderProps = {
  canEditPlanning: boolean
  children: ReactNode
}

export function WorkspaceCapabilitiesProvider(props: Readonly<WorkspaceCapabilitiesProviderProps>) {
  const { canEditPlanning, children } = props
  return (
    <WorkspaceCapabilitiesContext.Provider value={{ canEditPlanning }}>
      {children}
    </WorkspaceCapabilitiesContext.Provider>
  )
}

/**
 * True when the current user may change planning data (owner, admin, member).
 * Viewers get false: hide or disable write controls for them.
 */
export function useCanEdit(): boolean {
  return useContext(WorkspaceCapabilitiesContext).canEditPlanning
}
