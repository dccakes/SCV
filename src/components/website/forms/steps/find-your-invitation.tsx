'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import type { StepFormProps } from '~/app/utils/shared-types'
import { useRsvpForm, useUpdateRsvpForm } from '~/components/contexts/rsvp-form-context'
import { api } from '~/trpc/react'

export default function FindYourInvitationForm({ goNext }: StepFormProps) {
  const t = useTranslations('rsvp')
  const tCommon = useTranslations('common')
  const { weddingData } = useRsvpForm()
  const updateRsvpForm = useUpdateRsvpForm()
  const [name, setName] = useState<string>('')
  const [showError, setShowError] = useState<boolean>(false)

  const subUrl = weddingData.website?.subUrl ?? ''

  const { refetch, isFetching } = api.household.findBySearchPublic.useQuery(
    { subUrl, searchText: name },
    {
      enabled: false,
      retry: false,
    }
  )

  const handleOnSearch = () => {
    // the method to conditionally execute client db queries?
    void refetch().then((res) => {
      // Only advance when the search actually returned households. Guarding on
      // presence (not just length) keeps an errored or empty response on this
      // step showing the retry hint, instead of dropping the guest onto a blank
      // confirm screen with no names to pick.
      if (res.error || !res.data || res.data.length === 0) {
        setShowError(true)
      } else {
        updateRsvpForm({ matchedHouseholds: res.data })
        goNext?.()
      }
    })
  }

  return (
    <div className='flex flex-col gap-5'>
      <h2 className='text-2xl tracking-widest'>
        {t('weddingTitle', {
          brideFirstName: weddingData.brideFirstName ?? '',
          groomFirstName: weddingData.groomFirstName ?? '',
        })}
      </h2>
      <p className='mb-3 font-thin'>{t('groupNote')}</p>
      <input
        placeholder={t('fullNamePlaceholder')}
        className='border border-gray-400 bg-white p-3 text-black placeholder:text-gray-500'
        onChange={(e) => {
          setShowError(false)
          setName(e.target.value)
        }}
        value={name}
      />
      {showError && <p className='text-xs'>{t('notFound')}</p>}
      <button
        className={`mt-3 py-3 text-white text-xl tracking-wide ${name.length === 0 || isFetching ? 'cursor-not-allowed bg-stone-400' : 'bg-stone-700'}`}
        type='button'
        disabled={name.length === 0}
        onClick={handleOnSearch}
      >
        {isFetching ? tCommon('searching') : t('findInvitation')}
      </button>
    </div>
  )
}
