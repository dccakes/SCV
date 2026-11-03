'use client'

import { useTranslations } from 'next-intl'

import { AsyncState } from '~/components/ui/async-state'

/** Shown when an RSVP submit was rate limited. Its own component so only this path needs i18n. */
export function SubmitBusyMessage() {
  const t = useTranslations('rsvp')
  return <AsyncState error={t('submitTooManyRequests')} className='mb-4 text-center' />
}
