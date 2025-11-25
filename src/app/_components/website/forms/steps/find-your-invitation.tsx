'use client'

import { useState } from 'react'

import { useRsvpForm, useUpdateRsvpForm } from '~/app/_components/contexts/rsvp-form-context'
import { type StepFormProps } from '~/app/utils/shared-types'
import { api } from '~/trpc/react'

export default function FindYourInvitationForm({ goNext }: StepFormProps) {
  const { weddingData } = useRsvpForm()
  const updateRsvpForm = useUpdateRsvpForm()
  const [name, setName] = useState<string>('')
  const [showError, setShowError] = useState<boolean>(false)

  const { refetch, isFetching } = api.household.findBySearch.useQuery(
    { searchText: name },
    {
      enabled: false,
      retry: false,
    }
  )

  const handleOnSearch = () => {
    // the method to conditionally execute client db queries?
    void refetch().then((res) => {
      if (res.error ?? res.data?.length === 0) {
        setShowError(true)
      } else {
        updateRsvpForm({ matchedHouseholds: res.data })
        goNext?.()
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-2xl tracking-widest">{`${weddingData.groomFirstName} & ${weddingData.brideFirstName}'s wedding`}</h2>
      <p className="mb-3 font-thin">
        If you&apos;re responding for you and a guest (or for your family), you&apos;ll be able to
        RSVP for your entire group.
      </p>
      <input
        placeholder="Full Name"
        className="border border-gray-400 p-3"
        onChange={(e) => {
          setShowError(false)
          setName(e.target.value)
        }}
        value={name}
      />
      {showError && (
        <p className="text-xs">
          Oops! We&apos;re having trouble finding your invite. Please try another spelling of your
          name or contact the couple
        </p>
      )}
      <button
        className={`mt-3 py-3 text-xl tracking-wide text-white ${name.length === 0 || isFetching ? 'cursor-not-allowed bg-stone-400' : 'bg-stone-700'}`}
        type="button"
        disabled={name.length === 0}
        onClick={handleOnSearch}
      >
        {isFetching ? 'Searching...' : 'FIND YOUR INVITATION'}
      </button>
    </div>
  )
}
