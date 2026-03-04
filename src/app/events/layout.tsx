import type { ReactNode } from 'react'

import { AppLayoutShell } from '~/app/_components/dashboard/app-layout-shell'

export const dynamic = 'force-dynamic'

export default function EventsLayout({ children }: { children: ReactNode }) {
  return <AppLayoutShell>{children}</AppLayoutShell>
}
