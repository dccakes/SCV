import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import AuthenticatedAppShell from '@/components/layout/authenticated-app-shell'
import { PostHogAuthIdentity } from '~/components/analytics/posthog-auth-identity'
import { PostHogSessionRecording } from '~/components/analytics/posthog-session-recording'
import { auth } from '~/lib/auth'
import { getUserFirstName, getUserInitials } from '~/lib/user-display'
import { resolveWorkspaceScope } from '~/server/application/workspace/workspace-scope'
import { isAccessError } from '~/server/authz/auth-error-helpers'
import { readWorkspaceCapabilities } from '~/server/authz/workspace-capabilities'
import { api } from '~/trpc/server'

type AuthenticatedLayoutFrameProps = {
  children: ReactNode
  showEttaPanel?: boolean
}

export async function AuthenticatedLayoutFrame(props: Readonly<AuthenticatedLayoutFrameProps>) {
  const { children, showEttaPanel = false } = props
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  const userId = session?.user?.id ?? null
  if (!userId) {
    redirect('/auth/sign-in')
  }

  const workspaceScope = await resolveWorkspaceScope({
    session,
    userId,
  })

  const workspaceCapabilities = readWorkspaceCapabilities(workspaceScope.activeOrganization?.role)
  if (!workspaceCapabilities.canViewPlanning) {
    redirect('/')
  }

  let coupleName: string | undefined
  let weddingDate: string | undefined
  let weddingLocation: string | undefined
  try {
    const details = await api.wedding.getDetails()
    const brideFirstName = details?.brideFirstName?.trim() ?? ''
    const groomFirstName = details?.groomFirstName?.trim() ?? ''
    coupleName =
      brideFirstName && groomFirstName ? `${brideFirstName} & ${groomFirstName}` : undefined
    weddingDate = details?.weddingDate
      ? new Date(details.weddingDate).toLocaleDateString('en-us', {
          weekday: 'long',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : undefined
    weddingLocation = details?.weddingLocation?.trim() || undefined
  } catch (error) {
    if (!isAccessError(error)) {
      throw error
    }
  }
  const isEttaConfigured = Boolean(process.env.AI_GATEWAY_API_KEY)
  const currentUserFirstName = getUserFirstName(session?.user?.name, session?.user?.email)
  const currentUserInitials = getUserInitials(session?.user?.name, session?.user?.email)
  const weddingId = workspaceScope.activeWeddingId ?? undefined
  const createdAt =
    session?.user && 'createdAt' in session.user ? (session.user.createdAt as string | Date) : null

  return (
    <>
      <PostHogSessionRecording enabled={false} />
      <PostHogAuthIdentity
        userId={session.user.id}
        email={session.user.email ?? null}
        name={session.user.name ?? null}
        createdAt={createdAt}
        weddingId={weddingId}
      />
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
    </>
  )
}
