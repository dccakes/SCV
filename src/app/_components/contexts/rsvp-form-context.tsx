'use client'

import { createContext, useContext, useState } from 'react'
import { type ReactNode } from 'react'

import {
  type Answer,
  type Guest,
  type HouseholdSearch,
  type Invitation,
  type RsvpFormResponse,
  type RsvpPageData,
} from '~/app/utils/shared-types'

interface AnswerWithType extends Answer {
  questionType: string
}

type H = HouseholdSearch[0]
interface SelectedHousehold extends H {
  id: string
  primaryContact: Guest | undefined
  guests: Array<Guest & { invitations: Invitation[] }>
}

type RsvpFormState = {
  matchedHouseholds?: HouseholdSearch
  selectedHousehold?: SelectedHousehold
  rsvpResponses: RsvpFormResponse[]
  answersToQuestions: AnswerWithType[]
  weddingData: Partial<RsvpPageData>
}

const INITIAL_STATE: RsvpFormState = {
  matchedHouseholds: [],
  // selectedHousehold: null,
  rsvpResponses: [],
  answersToQuestions: [],
  weddingData: {
    groomFirstName: '',
    groomLastName: '',
    brideFirstName: '',
    brideLastName: '',
    date: {
      standardFormat: '',
      numberFormat: '',
    },
    daysRemaining: 0,
    events: [],
  },
}

const RsvpFormContext = createContext(INITIAL_STATE)
const RsvpFormUpdateContext = createContext((_fields: Partial<RsvpFormState>) => {
  return
})

interface RsvpFormProviderProps {
  children?: ReactNode
}

export const useRsvpForm = () => {
  return useContext(RsvpFormContext)
}

export const useUpdateRsvpForm = () => {
  return useContext(RsvpFormUpdateContext)
}

export const RsvpFormProvider = ({ children }: RsvpFormProviderProps) => {
  const [rsvpFormData, setRsvpFormData] = useState<RsvpFormState>(INITIAL_STATE)

  const updateFields = (fields: Partial<RsvpFormState>) => {
    setRsvpFormData((prev) => {
      return { ...prev, ...fields }
    })
  }

  return (
    <RsvpFormContext.Provider value={rsvpFormData}>
      <RsvpFormUpdateContext.Provider value={updateFields}>
        {children}
      </RsvpFormUpdateContext.Provider>
    </RsvpFormContext.Provider>
  )
}
