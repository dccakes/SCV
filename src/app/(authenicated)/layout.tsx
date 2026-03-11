import type { ReactNode } from 'react'

import { AuthenticatedLayoutFrame } from '@/components/layout/authenticated-layout-frame'
import { EventFormProvider } from '~/app/_components/contexts/event-form-context'
import { GuestFormProvider } from '~/app/_components/contexts/guest-form-context'

export const dynamic = 'force-dynamic'

type AuthenicatedLayoutProps = {
  children: ReactNode
}

export default async function AuthenicatedLayout({ children }: Readonly<AuthenicatedLayoutProps>) {
  return (
    <EventFormProvider>
      <GuestFormProvider>
        <AuthenticatedLayoutFrame>{children}</AuthenticatedLayoutFrame>
      </GuestFormProvider>
    </EventFormProvider>
  )
}
