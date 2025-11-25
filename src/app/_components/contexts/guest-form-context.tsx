'use client'

import { createContext, useContext, useState } from 'react'
import { type ReactNode } from 'react'

const GuestFormContext = createContext(false)
const GuestFormUpdateContext = createContext(() => {
  return
})

interface GuestFormProviderProps {
  children?: ReactNode
}

export const useGuestForm = () => {
  return useContext(GuestFormContext)
}

export const useToggleGuestForm = () => {
  return useContext(GuestFormUpdateContext)
}

export const GuestFormProvider = ({ children }: GuestFormProviderProps) => {
  const [isGuestFormOpen, setIsGuestFormOpen] = useState<boolean>(false)

  const toggleGuestForm = () => {
    setIsGuestFormOpen((prevState) => !prevState)
  }

  return (
    <GuestFormContext.Provider value={isGuestFormOpen}>
      <GuestFormUpdateContext.Provider value={toggleGuestForm}>
        {children}
      </GuestFormUpdateContext.Provider>
    </GuestFormContext.Provider>
  )
}
