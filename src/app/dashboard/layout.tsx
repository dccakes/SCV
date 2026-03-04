import '~/styles/globals.css'

import type { ReactNode } from 'react'
import { EditRsvpSettingsFormProvider } from '~/app/_components/contexts/edit-rsvp-settings-form-context'
import { AppLayoutShell } from '~/app/_components/dashboard/app-layout-shell'
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
      <AppLayoutShell>
        <EditRsvpSettingsFormProvider>{children}</EditRsvpSettingsFormProvider>
      </AppLayoutShell>
    </TRPCReactProvider>
  )
}
