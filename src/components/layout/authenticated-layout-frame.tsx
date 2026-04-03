import { headers } from 'next/headers'
import type { ReactNode } from 'react'
import AuthenticatedAppShell from '@/components/layout/authenticated-app-shell'
import { getSidebarWeddingInfo } from '@/components/old_dashboard/sidebar-wedding-info'
import { auth } from '~/lib/auth'
import { getDashboardOverview } from '~/server/application/dashboard/dashboard-request-data'
import { api } from '~/trpc/server'

type AuthenticatedLayoutFrameProps = {
  children: ReactNode
  showEttaPanel?: boolean
}

function getUserFirstName(name?: string | null, email?: string | null): string | undefined {
  const trimmedName = name?.trim()
  if (trimmedName) {
    return trimmedName.split(/\s+/, 1)[0]
  }

  const localPart = email?.split('@')[0]?.trim()
  if (!localPart) {
    return undefined
  }

  return localPart.charAt(0).toUpperCase() + localPart.slice(1)
}

function getUserInitials(name?: string | null, email?: string | null): string {
  const trimmedName = name?.trim()
  if (trimmedName) {
    const parts = trimmedName.split(/\s+/).filter(Boolean)
    const first = parts[0]?.[0] ?? ''
    const second = parts[1]?.[0] ?? ''
    return `${first}${second || first}`.toUpperCase()
  }

  const localPart = email?.split('@')[0]?.trim()
  if (!localPart) {
    return 'U'
  }

  return localPart.slice(0, 2).toUpperCase()
}

export async function AuthenticatedLayoutFrame(props: Readonly<AuthenticatedLayoutFrameProps>) {
  const { children, showEttaPanel = false } = props
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  const dashboardData = await getDashboardOverview()
  const isEttaConfigured = Boolean(process.env.AI_GATEWAY_API_KEY)
  const { coupleName, weddingDate, weddingLocation } = getSidebarWeddingInfo(
    dashboardData?.weddingData
  )
  const currentUserFirstName = getUserFirstName(session?.user?.name, session?.user?.email)
  const currentUserInitials = getUserInitials(session?.user?.name, session?.user?.email)

  let weddingId: string | undefined
  if (showEttaPanel) {
    const wedding = await api.wedding.getByUserId()
    weddingId = wedding?.id
  }

  return (
    <AuthenticatedAppShell
      coupleName={coupleName}
      currentUserFirstName={currentUserFirstName}
      currentUserInitials={currentUserInitials}
      weddingDate={weddingDate}
      weddingLocation={weddingLocation}
      showEttaPanel={showEttaPanel}
      weddingId={weddingId}
      isEttaConfigured={isEttaConfigured}
    >
      {children}
    </AuthenticatedAppShell>
  )
}
