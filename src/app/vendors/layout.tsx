import '~/styles/globals.css'

import type { ReactNode } from 'react'

import { Toaster } from 'sonner'

import { AuthenticatedLayoutFrame } from '@/components/layout/authenticated-layout-frame'
import { TRPCReactProvider } from '~/trpc/react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Vendors | Your Wedding Website',
  description: 'Manage your wedding vendors',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export default async function VendorsLayout({ children }: { children: ReactNode }) {
  return (
    <TRPCReactProvider>
      <AuthenticatedLayoutFrame>{children}</AuthenticatedLayoutFrame>
      <Toaster position='top-right' richColors />
    </TRPCReactProvider>
  )
}
