import '~/styles/globals.css'

import { EditRsvpSettingsFormProvider } from '~/app/_components/contexts/edit-rsvp-settings-form-context'
import DashboardSidebar from '~/app/_components/dashboard/dashboard-sidebar'
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
        <div className='flex h-screen overflow-hidden bg-background'>
          <DashboardSidebar />
          <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>{children}</div>
        </div>
      </EditRsvpSettingsFormProvider>
    </TRPCReactProvider>
  )
}
