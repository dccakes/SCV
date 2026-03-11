import '~/styles/globals.css'

import type { ReactNode } from 'react'
import { AuthenticatedLayoutFrame } from '@/components/layout/authenticated-layout-frame'
import { EditRsvpSettingsFormProvider } from '~/app/_components/contexts/edit-rsvp-settings-form-context'
import { EventFormProvider } from '~/app/_components/contexts/event-form-context'
import { GuestFormProvider } from '~/app/_components/contexts/guest-form-context'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Your Wedding Website',
  description: 'dashboard',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <EventFormProvider>
      <GuestFormProvider>
        <AuthenticatedLayoutFrame showEttaPanel>
          <EditRsvpSettingsFormProvider>{children}</EditRsvpSettingsFormProvider>
        </AuthenticatedLayoutFrame>
      </GuestFormProvider>
    </EventFormProvider>
  )
}
