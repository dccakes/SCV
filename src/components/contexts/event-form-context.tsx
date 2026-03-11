'use client'

import { createContext, type ReactNode, useContext, useState } from 'react'

const EventFormContext = createContext(false)
const EventFormUpdateContext = createContext(() => {
  return
})

interface EventFormProviderProps {
  children?: ReactNode
}

export const useEventForm = () => {
  return useContext(EventFormContext)
}

export const useToggleEventForm = () => {
  return useContext(EventFormUpdateContext)
}

export const EventFormProvider = ({ children }: EventFormProviderProps) => {
  const [isEventFormOpen, setIsEventFormOpen] = useState<boolean>(false)

  const toggleEventForm = () => {
    setIsEventFormOpen((prevState) => !prevState)
  }

  return (
    <EventFormContext.Provider value={isEventFormOpen}>
      <EventFormUpdateContext.Provider value={toggleEventForm}>
        {children}
      </EventFormUpdateContext.Provider>
    </EventFormContext.Provider>
  )
}
