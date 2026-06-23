'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import type { StepFormProps } from '~/app/utils/shared-types'
import { useRsvpForm } from '~/components/contexts/rsvp-form-context'

interface SendRsvpProps extends StepFormProps {
  isFetching: boolean
}

export default function SendRsvp({ goBack, isFetching }: SendRsvpProps) {
  const t = useTranslations('rsvp')
  const tCommon = useTranslations('common')
  const { weddingData } = useRsvpForm()
  const [email, setEmail] = useState<string>('')
  const [showSendEmailConfirmation, setShowSendEmailConfirmation] = useState<boolean>(true)

  return (
    <div className='flex flex-col gap-5'>
      <h2 className='text-2xl tracking-widest'>
        {t('sendRsvpTitle', {
          groomFirstName: weddingData.groomFirstName,
          brideFirstName: weddingData.brideFirstName,
        })}
      </h2>
      <div className='flex items-center gap-3'>
        <input
          id='send-email-confirmation'
          type='checkbox'
          checked={showSendEmailConfirmation}
          style={{ accentColor: 'rgb(55 65 81)' }}
          onChange={(e) => setShowSendEmailConfirmation(e.target.checked)}
          className='h-6 w-6'
        />
        <label htmlFor='send-email-confirmation'>{t('sendEmailConfirmation')}</label>
      </div>
      {showSendEmailConfirmation && (
        <input
          type='email'
          placeholder={t('emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='border p-3'
        />
      )}
      <button
        disabled={showSendEmailConfirmation && email.length === 0}
        className={`mt-3 py-3 text-white text-xl tracking-wide ${(showSendEmailConfirmation && email.length === 0) || isFetching ? 'cursor-not-allowed bg-stone-400' : 'bg-stone-700'}`}
        type='submit'
      >
        {t('sendRsvp')}
      </button>
      <button
        className={`mt-3 bg-gray-700 py-3 text-white text-xl tracking-wide`}
        type='button'
        onClick={() => goBack?.()}
      >
        {tCommon('back')}
      </button>
      <p className='text-xs underline'>{tCommon('privacyPolicy')}</p>
    </div>
  )
}
