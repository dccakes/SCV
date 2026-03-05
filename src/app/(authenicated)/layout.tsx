import type { ReactNode } from 'react'

import { AuthenticatedLayoutFrame } from '@/components/layout/authenticated-layout-frame'

type AuthenicatedLayoutProps = {
  children: ReactNode
}

export default async function AuthenicatedLayout({ children }: Readonly<AuthenicatedLayoutProps>) {
  return <AuthenticatedLayoutFrame>{children}</AuthenticatedLayoutFrame>
}
