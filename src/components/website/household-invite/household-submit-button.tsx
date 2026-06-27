'use client'

import { useFormStatus } from 'react-dom'

import { Button } from '~/components/ui/button'

export function HouseholdSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type='submit' disabled={pending}>
      {pending ? 'Saving...' : 'Save details'}
    </Button>
  )
}
