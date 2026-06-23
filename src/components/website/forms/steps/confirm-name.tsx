'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import type { HouseholdSearch, StepFormProps } from '~/app/utils/shared-types'
import { useRsvpForm, useUpdateRsvpForm } from '~/components/contexts/rsvp-form-context'

type HouseholdSearchItem = HouseholdSearch[number]
type GuestWithInvitations = HouseholdSearchItem['guests'][number]

export default function ConfirmNameForm({ goNext, goBack }: StepFormProps) {
  const t = useTranslations('rsvp')
  const tCommon = useTranslations('common')
  const { matchedHouseholds, selectedHousehold: currentSelectedHousehold } = useRsvpForm()
  const updateRsvpForm = useUpdateRsvpForm()
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>()

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
      <h2 className='text-2xl tracking-widest'>{t('foundInGuestList')}</h2>
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
        {tCommon('continue')}
      </button>
      <button
        className={`mt-3 bg-gray-700 py-3 text-white text-xl tracking-wide`}
        type='button'
        onClick={() => goBack?.()}
      >
        {t('searchAgain')}
      </button>
    </div>
  )
}
