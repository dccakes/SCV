import '~/styles/globals.css'

import { EditRsvpSettingsFormProvider } from '~/app/_components/contexts/edit-rsvp-settings-form-context'
import DashboardShell from '~/app/_components/dashboard/dashboard-shell'
import { TRPCReactProvider } from '~/trpc/react'

export const metadata = {
  title: 'Your Wedding Website',
  description: 'dashboard',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <TRPCReactProvider>
      <EditRsvpSettingsFormProvider>
        <DashboardShell>{children}</DashboardShell>
      </EditRsvpSettingsFormProvider>
    </TRPCReactProvider>
  )
}
