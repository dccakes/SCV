import type { ReactNode } from 'react'

import { AppLayoutShell } from '~/app/_components/dashboard/app-layout-shell'

type AuthenicatedLayoutProps = {
  children: ReactNode
}

export const dynamic = 'force-dynamic'

export default async function AuthenicatedLayout(props: Readonly<AuthenicatedLayoutProps>) {
  return <AppLayoutShell>{props.children}</AppLayoutShell>
}
