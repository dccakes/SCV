'use client'

import { useState } from 'react'
import type { HouseholdSearch, StepFormProps } from '~/app/utils/shared-types'
import { useRsvpForm, useUpdateRsvpForm } from '~/components/contexts/rsvp-form-context'

type HouseholdSearchItem = HouseholdSearch[number]
type GuestWithInvitations = HouseholdSearchItem['guests'][number]

export default function ConfirmNameForm({ goNext, goBack }: StepFormProps) {
  const {
    matchedHouseholds,
    selectedHousehold: currentSelectedHousehold,
    recognized,
  } = useRsvpForm()
  const updateRsvpForm = useUpdateRsvpForm()
  // Pre-select when there's only one match (always the case for a recognized
  // guest), so they can confirm in a single tap.
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | undefined>(() =>
    matchedHouseholds && matchedHouseholds.length === 1 ? matchedHouseholds[0]?.id : undefined
  )

  // "Not you" clears the invite-recognized match and sends the guest back to the
  // name search, in case they opened someone else's save-the-date link.
  const onNotYou = () => {
    updateRsvpForm({
      recognized: false,
      matchedHouseholds: [],
      selectedHousehold: undefined,
      rsvpResponses: [],
      answersToQuestions: [],
    })
    goBack?.()
  }

  const onContinue = () => {
    const selectedHousehold = matchedHouseholds?.find(
      (household: HouseholdSearchItem) => household.id === selectedHouseholdId
    )
    const primaryContact = selectedHousehold?.guests?.find(
      (guest: GuestWithInvitations) => guest.isPrimaryContact
    )
    const householdDidChange = selectedHouseholdId !== currentSelectedHousehold?.id
    updateRsvpForm(
      householdDidChange
        ? {
            selectedHousehold: Object.assign({ primaryContact }, selectedHousehold),
            rsvpResponses: [],
            answersToQuestions: [],
          }
        : {
            selectedHousehold: Object.assign({ primaryContact }, selectedHousehold),
          }
    )
    goNext?.()
  }

  return (
    <div className='flex flex-col gap-5'>
      <h2 className='text-2xl tracking-widest'>
        {recognized
          ? "we found your invitation. confirm it's you below to continue, or choose “not you” to search by name"
          : 'we’ve found you in the guest list. please confirm your name below to continue with your rsvp'}
      </h2>
      {matchedHouseholds?.map((household: HouseholdSearchItem) => {
        return (
          <div key={household.id} className='flex gap-5'>
            <input
              type='radio'
              id={household.id}
              checked={selectedHouseholdId === household.id}
              onChange={() => setSelectedHouseholdId(household.id)}
            />
            <label htmlFor={household.id}>
              {household.guests
                ?.map((guest: GuestWithInvitations) => `${guest.firstName} ${guest.lastName}`)
                .join(', ')}
            </label>
          </div>
        )
      })}

      <button
        className={`mt-3 bg-stone-400 py-3 text-white text-xl tracking-wide ${selectedHouseholdId === undefined ? 'cursor-not-allowed bg-stone-400' : 'bg-stone-700'}`}
        type='button'
        disabled={selectedHouseholdId === undefined}
        onClick={onContinue}
      >
        CONTINUE
      </button>
      <button
        className={`mt-3 bg-gray-700 py-3 text-white text-xl tracking-wide`}
        type='button'
        onClick={recognized ? onNotYou : () => goBack?.()}
      >
        {recognized ? 'NOT YOU?' : 'SEARCH AGAIN'}
      </button>
    </div>
  )
}
