import '~/styles/globals.css'

import { EditRsvpSettingsFormProvider } from '~/app/_components/contexts/edit-rsvp-settings-form-context'
import Footer from '~/app/_components/footer'
import Navbar from '~/app/_components/navbar'
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
        <Navbar />
        {children}
        <Footer />
      </EditRsvpSettingsFormProvider>
    </TRPCReactProvider>
  )
}
