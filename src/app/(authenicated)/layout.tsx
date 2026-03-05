import type { ReactNode } from 'react'

import { AuthenticatedLayoutFrame } from '@/components/layout/authenticated-layout-frame'
import { TRPCReactProvider } from '~/trpc/react'
import { Toaster } from 'sonner'

type AuthenicatedLayoutProps = {
  children: ReactNode
}

export const dynamic = 'force-dynamic'

export default async function AuthenicatedLayout({ children }: Readonly<AuthenicatedLayoutProps>) {
  return (
    <TRPCReactProvider>
      <AuthenticatedLayoutFrame>{children}</AuthenticatedLayoutFrame>
      <Toaster position='top-right' richColors />
    </TRPCReactProvider>
  )
}
