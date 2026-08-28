'use client'

import { useTranslations } from 'next-intl'
import { useFormStatus } from 'react-dom'

import { Button } from '~/components/ui/button'

export function HouseholdSubmitButton() {
  const { pending } = useFormStatus()
  const tCommon = useTranslations('common')
  const tHousehold = useTranslations('household')

  return (
    <Button type='submit' disabled={pending}>
      {pending ? tCommon('saving') : tHousehold('saveDetails')}
    </Button>
  )
}
