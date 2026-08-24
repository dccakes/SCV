import type { ReactNode } from 'react'
import { EventFormProvider } from '~/components/contexts/event-form-context'
import { GuestFormProvider } from '~/components/contexts/guest-form-context'
import { AuthenticatedLayoutFrame } from '~/components/layout/authenticated-layout-frame'

export const dynamic = 'force-dynamic'

type AuthenicatedLayoutProps = {
  children: ReactNode
}

export default async function AuthenicatedLayout({ children }: Readonly<AuthenicatedLayoutProps>) {
  return (
    <EventFormProvider>
      <GuestFormProvider>
        <AuthenticatedLayoutFrame showEttaPanel>{children}</AuthenticatedLayoutFrame>
      </GuestFormProvider>
    </EventFormProvider>
  )
}
