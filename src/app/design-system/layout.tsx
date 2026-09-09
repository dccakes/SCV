import type { ReactNode } from 'react'
import { getRequiredWedding } from '~/server/application/authenticated-route/authenticated-route-data'

type DesignSystemLayoutProps = {
  children: ReactNode
}

export default async function DesignSystemLayout({ children }: Readonly<DesignSystemLayoutProps>) {
  await getRequiredWedding()
  return <>{children}</>
}
