'use client'

import { useTranslations } from 'next-intl'
import type { StepFormProps } from '~/app/utils/shared-types'
import { useRsvpForm } from '~/components/contexts/rsvp-form-context'

interface SendRsvpProps extends StepFormProps {
  isFetching: boolean
}

export default function SendRsvp({ goBack, isFetching }: SendRsvpProps) {
  const t = useTranslations('rsvp')
  const tCommon = useTranslations('common')
  const { weddingData } = useRsvpForm()

  return (
    <div className='flex flex-col gap-5'>
      <h2 className='text-2xl tracking-widest'>
        {t('sendRsvpTitle', {
          groomFirstName: weddingData.groomFirstName,
          brideFirstName: weddingData.brideFirstName,
        })}
      </h2>
      <button
        disabled={isFetching}
        className={`mt-3 py-3 text-white text-xl tracking-wide ${isFetching ? 'cursor-not-allowed bg-stone-400' : 'bg-stone-700'}`}
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
