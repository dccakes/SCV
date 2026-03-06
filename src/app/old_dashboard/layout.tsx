import '~/styles/globals.css'

import type { ReactNode } from 'react'
import { AuthenticatedLayoutFrame } from '@/components/layout/authenticated-layout-frame'
import { EditRsvpSettingsFormProvider } from '~/app/_components/contexts/edit-rsvp-settings-form-context'
import { TRPCReactProvider } from '~/trpc/react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Your Wedding Website',
  description: 'dashboard',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <TRPCReactProvider>
      <AuthenticatedLayoutFrame showEttaPanel>
        <EditRsvpSettingsFormProvider>{children}</EditRsvpSettingsFormProvider>
      </AuthenticatedLayoutFrame>
    </TRPCReactProvider>
  )
}
