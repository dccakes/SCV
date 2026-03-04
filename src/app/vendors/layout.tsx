import '~/styles/globals.css'

import type { ReactNode } from 'react'

import { Toaster } from 'sonner'

import { AppLayoutShell } from '~/app/_components/dashboard/app-layout-shell'
import { TRPCReactProvider } from '~/trpc/react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Vendors | Your Wedding Website',
  description: 'Manage your wedding vendors',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export default function VendorsLayout({ children }: { children: ReactNode }) {
  return (
    <TRPCReactProvider>
      <AppLayoutShell>{children}</AppLayoutShell>
      <Toaster position='top-right' richColors />
    </TRPCReactProvider>
  )
}
