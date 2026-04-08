'use client'

import { useEffect, useState } from 'react'
import type { StepFormProps } from '~/app/utils/shared-types'
import { useRsvpForm } from '~/components/contexts/rsvp-form-context'
import { api } from '~/trpc/react'

export default function UpdateContactInfoForm({ goNext, goBack }: StepFormProps) {
  const { rsvpToken, confirmedHousehold, weddingData } = useRsvpForm()
  const subUrl = weddingData.website?.subUrl ?? ''

  const primaryContact = confirmedHousehold?.guests.find((g) => g.isPrimaryContact)
  const needsContactInfo = confirmedHousehold
    ? !primaryContact?.email || !primaryContact?.phone
    : false

  const [email, setEmail] = useState(primaryContact?.email ?? '')
  const [phone, setPhone] = useState(primaryContact?.phone ?? '')
  const [saveError, setSaveError] = useState<string | null>(null)

  // Auto-advance when confirmed household has complete contact info
  useEffect(() => {
    if (confirmedHousehold && !needsContactInfo) {
      goNext?.()
    }
  }, [confirmedHousehold, needsContactInfo, goNext])

  const updateContact = api.website.updateGuestContactInfo.useMutation({
    onSuccess: () => {
      goNext?.()
    },
    onError: (err) => {
      setSaveError(err.message)
    },
  })

  const handleSave = () => {
    if (!rsvpToken) {
      goNext?.()
      return
    }
    setSaveError(null)
    updateContact.mutate({
      subUrl,
      rsvpToken,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    })
  }

  // If not needed or not yet determined, render nothing (useEffect handles advance)
  if (!confirmedHousehold || !needsContactInfo) return null

  return (
    <div className='flex flex-col gap-5'>
      <h2 className='text-2xl tracking-widest'>keep in touch</h2>
      <p className='font-thin'>
        Help us keep in touch — fill in any missing details below. You can skip this step if you
        prefer.
      </p>

      {!primaryContact?.email && (
        <div className='flex flex-col gap-1'>
          <label htmlFor='contact-email' className='text-sm text-stone-600'>
            Email address
          </label>
          <input
            id='contact-email'
            type='email'
            placeholder='your@email.com'
            className='border border-gray-400 p-3'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      )}

      {!primaryContact?.phone && (
        <div className='flex flex-col gap-1'>
          <label htmlFor='contact-phone' className='text-sm text-stone-600'>
            Phone number
          </label>
          <input
            id='contact-phone'
            type='tel'
            placeholder='+1 (555) 000-0000'
            className='border border-gray-400 p-3'
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      )}

      {saveError && <p className='text-xs text-red-600'>{saveError}</p>}

      <button
        className={`mt-3 py-3 text-white text-xl tracking-wide ${updateContact.isPending ? 'cursor-not-allowed bg-stone-400' : 'bg-stone-700'}`}
        type='button'
        disabled={updateContact.isPending}
        onClick={handleSave}
      >
        {updateContact.isPending ? 'Saving...' : 'SAVE & CONTINUE'}
      </button>
      <button
        className='mt-3 bg-transparent py-2 text-stone-500 text-sm tracking-wide underline'
        type='button'
        onClick={() => goNext?.()}
      >
        Skip
      </button>
      <button
        className='mt-1 bg-gray-700 py-3 text-white text-xl tracking-wide'
        type='button'
        onClick={() => goBack?.()}
      >
        BACK
      </button>
    </div>
  )
}
