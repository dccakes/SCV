import type { ReactNode } from 'react'

import { AuthenticatedLayoutFrame } from '~/app/_components/layout/authenticated-layout-frame'

type AuthenicatedLayoutProps = {
  children: ReactNode
}

export const dynamic = 'force-dynamic'

export default async function AuthenicatedLayout(props: Readonly<AuthenicatedLayoutProps>) {
  return <AuthenticatedLayoutFrame>{props.children}</AuthenticatedLayoutFrame>
}
