import type { ReactNode } from 'react'

import { AuthenticatedLayoutFrame } from '@/components/layout/authenticated-layout-frame'

export const dynamic = 'force-dynamic'

type AuthenicatedLayoutProps = {
  children: ReactNode
}

export default async function AuthenicatedLayout({ children }: Readonly<AuthenicatedLayoutProps>) {
  return <AuthenticatedLayoutFrame>{children}</AuthenticatedLayoutFrame>
}
