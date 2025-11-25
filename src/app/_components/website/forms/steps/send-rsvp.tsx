'use client'

import { useState } from 'react'

import { useRsvpForm } from '~/app/_components/contexts/rsvp-form-context'
import { type StepFormProps } from '~/app/utils/shared-types'

interface SendRsvpProps extends StepFormProps {
  isFetching: boolean
}

export default function SendRsvp({ goBack, isFetching }: SendRsvpProps) {
  const { weddingData } = useRsvpForm()
  const [email, setEmail] = useState<string>('')
  const [showSendEmailConfirmation, setShowSendEmailConfirmation] = useState<boolean>(true)

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-2xl tracking-widest">{`last step! send your rsvp to ${weddingData.groomFirstName} & ${weddingData.brideFirstName}'s wedding`}</h2>
      <div className="flex items-center gap-3">
        <input
          id="send-email-confirmation"
          type="checkbox"
          checked={showSendEmailConfirmation}
          style={{ accentColor: 'rgb(55 65 81)' }}
          onChange={(e) => setShowSendEmailConfirmation(e.target.checked)}
          className="h-6 w-6"
        />
        <label htmlFor="send-email-confirmation">Send me an RSVP confirmation by email</label>
      </div>
      {showSendEmailConfirmation && (
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-3"
        />
      )}
      <button
        disabled={showSendEmailConfirmation && email.length === 0}
        className={`mt-3 py-3 text-xl tracking-wide text-white ${(showSendEmailConfirmation && email.length === 0) || isFetching ? 'cursor-not-allowed bg-stone-400' : 'bg-stone-700'}`}
        type="submit"
      >
        SEND RSVP
      </button>
      <button
        className={`mt-3 bg-gray-700 py-3 text-xl tracking-wide text-white`}
        type="button"
        onClick={() => goBack?.()}
      >
        BACK
      </button>
      <p className="text-xs underline">View Our Privacy Policy</p>
    </div>
  )
}
