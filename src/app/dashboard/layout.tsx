import '~/styles/globals.css'

import type { ReactNode } from 'react'

import { EditRsvpSettingsFormProvider } from '~/app/_components/contexts/edit-rsvp-settings-form-context'
import DashboardShell from '~/app/_components/dashboard/dashboard-shell'
import { TRPCReactProvider } from '~/trpc/react'
import { api } from '~/trpc/server'

export const metadata = {
  title: 'Your Wedding Website',
  description: 'dashboard',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const dashboardData = await api.dashboard.getByUserId.query()
  const weddingData = dashboardData?.weddingData

  const brideFirstName = weddingData?.brideFirstName?.trim() ?? ''
  const groomFirstName = weddingData?.groomFirstName?.trim() ?? ''
  const coupleName = brideFirstName && groomFirstName ? `${brideFirstName} & ${groomFirstName}` : ''
  const weddingDate = weddingData?.date?.standardFormat ?? undefined

  return (
    <TRPCReactProvider>
      <EditRsvpSettingsFormProvider>
        <DashboardShell coupleName={coupleName || undefined} weddingDate={weddingDate}>
          {children}
        </DashboardShell>
      </EditRsvpSettingsFormProvider>
    </TRPCReactProvider>
  )
}
