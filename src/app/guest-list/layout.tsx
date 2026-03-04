import '~/styles/globals.css'

import type { ReactNode } from 'react'

import { Toaster } from 'sonner'

import { AppLayoutShell } from '~/app/_components/dashboard/app-layout-shell'
import { TRPCReactProvider } from '~/trpc/react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Your Wedding Website',
  description: 'dashboard',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export default function GuestListLayout({ children }: { children: ReactNode }) {
  return (
    <TRPCReactProvider>
      <AppLayoutShell>{children}</AppLayoutShell>
      <Toaster position='top-right' richColors />
    </TRPCReactProvider>
  )
}
