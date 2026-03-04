import type { ReactNode } from 'react'

import { AuthenticatedLayoutFrame } from '@/components/layout/authenticated-layout-frame'

export const dynamic = 'force-dynamic'

export default async function EventsLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedLayoutFrame>{children}</AuthenticatedLayoutFrame>
}
