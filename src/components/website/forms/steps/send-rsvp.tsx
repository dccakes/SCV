'use client'

import type { StepFormProps } from '~/app/utils/shared-types'
import { useRsvpForm } from '~/components/contexts/rsvp-form-context'

interface SendRsvpProps extends StepFormProps {
  isFetching: boolean
}

export default function SendRsvp({ goBack, isFetching }: SendRsvpProps) {
  const { weddingData } = useRsvpForm()

  return (
    <div className='flex flex-col gap-5'>
      <h2 className='text-2xl tracking-widest'>{`last step! send your rsvp to ${weddingData.brideFirstName} & ${weddingData.groomFirstName}'s wedding`}</h2>
      <button
        disabled={isFetching}
        className={`mt-3 py-3 text-white text-xl tracking-wide ${isFetching ? 'cursor-not-allowed bg-stone-400' : 'bg-stone-700'}`}
        type='submit'
      >
        SEND RSVP
      </button>
      <button
        className={`mt-3 bg-gray-700 py-3 text-white text-xl tracking-wide`}
        type='button'
        onClick={() => goBack?.()}
      >
        BACK
      </button>
      <p className='text-xs underline'>View Our Privacy Policy</p>
    </div>
  )
}
