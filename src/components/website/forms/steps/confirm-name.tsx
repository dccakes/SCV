'use client'

import { useState } from 'react'
import type { HouseholdRsvpLookup, StepFormProps } from '~/app/utils/shared-types'
import { useRsvpForm, useUpdateRsvpForm } from '~/components/contexts/rsvp-form-context'
import { api } from '~/trpc/react'

type LookupItem = HouseholdRsvpLookup[number]
type SubState = 'select' | 'email' | 'no_email'

export default function ConfirmNameForm({ goNext, goBack }: StepFormProps) {
  const { matchedHouseholdsPublic, weddingData } = useRsvpForm()
  const updateRsvpForm = useUpdateRsvpForm()
  const [subState, setSubState] = useState<SubState>('select')
  const [selectedHousehold, setSelectedHousehold] = useState<LookupItem | undefined>()
  const [email, setEmail] = useState<string>('')
  const [emailError, setEmailError] = useState<string | null>(null)

  const subUrl = weddingData.website?.subUrl ?? ''

  const confirmIdentity = api.website.confirmHouseholdIdentity.useMutation({
    onSuccess: (data) => {
      updateRsvpForm({
        rsvpToken: data.rsvpToken,
        confirmedHousehold: data.household,
      })
      // Persist token so returning guests skip the lookup step
      try {
        localStorage.setItem(`rsvp_token_${subUrl}`, data.rsvpToken)
      } catch {
        // localStorage unavailable — ignore
      }
      goNext?.()
    },
    onError: (err) => {
      setEmailError(err.message)
    },
  })

  const handleSelectHousehold = (household: LookupItem) => {
    setSelectedHousehold(household)
  }

  const handleContinueFromSelect = () => {
    if (!selectedHousehold) return
    if (selectedHousehold.primaryContactHasEmail) {
      setSubState('email')
    } else {
      setSubState('no_email')
    }
  }

  const handleConfirmEmail = () => {
    if (!selectedHousehold || !email.trim()) return
    setEmailError(null)
    confirmIdentity.mutate({ subUrl, householdId: selectedHousehold.id, email: email.trim() })
  }

  if (subState === 'no_email') {
    return (
      <div className='flex flex-col gap-5'>
        <h2 className='text-2xl tracking-widest'>we need to verify your identity</h2>
        <p className='font-thin leading-relaxed'>
          We couldn&apos;t verify your identity automatically because no email address is on file
          for your invitation.
        </p>
        <p className='font-thin leading-relaxed'>
          Please contact the couple to receive your personal RSVP link, or ask them to add your
          email address to your invitation.
        </p>
        <button
          className='mt-3 bg-gray-700 py-3 text-white text-xl tracking-wide'
          type='button'
          onClick={() => {
            setSubState('select')
            setSelectedHousehold(undefined)
          }}
        >
          SEARCH AGAIN
        </button>
      </div>
    )
  }

  if (subState === 'email') {
    return (
      <div className='flex flex-col gap-5'>
        <h2 className='text-2xl tracking-widest'>confirm your identity</h2>
        <p className='font-thin'>
          Please enter the email address associated with your invitation to continue.
        </p>
        <input
          type='email'
          placeholder='Email address'
          className='border border-gray-400 p-3'
          value={email}
          onChange={(e) => {
            setEmailError(null)
            setEmail(e.target.value)
          }}
        />
        {emailError && <p className='text-xs text-red-600'>{emailError}</p>}
        <button
          className={`mt-3 py-3 text-white text-xl tracking-wide ${!email.trim() || confirmIdentity.isPending ? 'cursor-not-allowed bg-stone-400' : 'bg-stone-700'}`}
          type='button'
          disabled={!email.trim() || confirmIdentity.isPending}
          onClick={handleConfirmEmail}
        >
          {confirmIdentity.isPending ? 'Verifying...' : 'CONFIRM'}
        </button>
        <button
          className='mt-3 bg-gray-700 py-3 text-white text-xl tracking-wide'
          type='button'
          onClick={() => setSubState('select')}
        >
          BACK
        </button>
      </div>
    )
  }

  // Default: 'select' sub-state
  return (
    <div className='flex flex-col gap-5'>
      <h2 className='text-2xl tracking-widest'>
        we&apos;ve found you in the guest list. please confirm your name below to continue with your
        rsvp
      </h2>
      {matchedHouseholdsPublic?.map((household) => {
        const mainGuests = household.guests.filter((g) => !g.isTagAlong)
        const tagAlongs = household.guests.filter((g) => g.isTagAlong)
        return (
          <div key={household.id} className='flex gap-5'>
            <input
              type='radio'
              id={household.id}
              checked={selectedHousehold?.id === household.id}
              onChange={() => handleSelectHousehold(household)}
            />
            <label htmlFor={household.id} className='flex flex-col gap-1'>
              <span>{mainGuests.map((g) => `${g.firstName} ${g.lastName}`).join(', ')}</span>
              {tagAlongs.length > 0 && (
                <span className='text-sm text-stone-500'>
                  + {tagAlongs.map((g) => g.firstName).join(', ')} (may be joining)
                </span>
              )}
            </label>
          </div>
        )
      })}

      <button
        className={`mt-3 py-3 text-white text-xl tracking-wide ${!selectedHousehold ? 'cursor-not-allowed bg-stone-400' : 'bg-stone-700'}`}
        type='button'
        disabled={!selectedHousehold}
        onClick={handleContinueFromSelect}
      >
        CONTINUE
      </button>
      <button
        className='mt-3 bg-gray-700 py-3 text-white text-xl tracking-wide'
        type='button'
        onClick={() => goBack?.()}
      >
        SEARCH AGAIN
      </button>
    </div>
  )
}
