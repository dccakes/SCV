'use client'

import { createContext, type ReactNode, useContext, useState } from 'react'

import type {
  Guest,
  HouseholdSearch,
  Invitation,
  RsvpFormResponse,
  RsvpPageData,
} from '~/app/utils/shared-types'
import type { AnswerWithType } from '~/components/website/forms/rsvp-state'

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
  /**
   * True when the guest was identified from their save-the-date invite cookie,
   * so the flow starts on the confirm step (skipping the name search) and offers
   * a "Not you" escape back to search.
   */
  recognized?: boolean
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
  /**
   * Household resolved from the guest's save-the-date invite cookie. When
   * present, the flow pre-fills the match and starts on the confirm step.
   */
  recognizedHousehold?: HouseholdSearch[number] | null
}

export const useRsvpForm = () => {
  return useContext(RsvpFormContext)
}

export const useUpdateRsvpForm = () => {
  return useContext(RsvpFormUpdateContext)
}

export const RsvpFormProvider = ({ children, recognizedHousehold }: RsvpFormProviderProps) => {
  const [rsvpFormData, setRsvpFormData] = useState<RsvpFormState>(() =>
    recognizedHousehold
      ? { ...INITIAL_STATE, matchedHouseholds: [recognizedHousehold], recognized: true }
      : INITIAL_STATE
  )

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
