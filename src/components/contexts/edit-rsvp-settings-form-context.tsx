'use client'

import { createContext, type ReactNode, useContext, useState } from 'react'

const EditRsvpSettingsFormContext = createContext(false)
const EditRsvpSettingsFormUpdateContext = createContext(() => {
  return
})

interface EditRsvpSettingsFormProviderProps {
  children?: ReactNode
}

export const useEditRsvpSettingsForm = () => {
  return useContext(EditRsvpSettingsFormContext)
}

export const useToggleEditRsvpSettingsForm = () => {
  return useContext(EditRsvpSettingsFormUpdateContext)
}

export const EditRsvpSettingsFormProvider = ({ children }: EditRsvpSettingsFormProviderProps) => {
  const [isEditRsvpSettingsFormOpen, setIsEditRsvpSettingsFormOpen] = useState<boolean>(false)

  const toggleEditRsvpSettingsForm = () => {
    setIsEditRsvpSettingsFormOpen((prevState) => !prevState)
  }

  return (
    <EditRsvpSettingsFormContext.Provider value={isEditRsvpSettingsFormOpen}>
      <EditRsvpSettingsFormUpdateContext.Provider value={toggleEditRsvpSettingsForm}>
        {children}
      </EditRsvpSettingsFormUpdateContext.Provider>
    </EditRsvpSettingsFormContext.Provider>
  )
}
