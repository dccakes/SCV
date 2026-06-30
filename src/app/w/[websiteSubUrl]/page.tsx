import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { resolveInvitedHousehold } from '~/app/w/[websiteSubUrl]/_lib/invited-household'
import { loadWeddingBySubUrl } from '~/app/w/[websiteSubUrl]/_lib/load-wedding-by-suburl'
import {
  grantWebsiteAccess,
  readWebsiteVisitorCookies,
} from '~/app/w/[websiteSubUrl]/_lib/website-access'
import PasswordPage from '~/components/website/password-page'
import WeddingWebsite from '~/components/website/wedding'

type RootRouteHandlerProps = {
  params: Promise<{
    websiteSubUrl: string
  }>
}

export async function generateMetadata({ params }: RootRouteHandlerProps): Promise<Metadata> {
  const { websiteSubUrl } = await params
  const { accessToken, inviteToken } = await readWebsiteVisitorCookies(websiteSubUrl)
  const loadResult = await loadWeddingBySubUrl(websiteSubUrl, accessToken, inviteToken)

  if (loadResult.status !== 'ready') {
    return {
      title: 'Wedding Website',
    }
  }

  return {
    title: `${loadResult.weddingData.groomFirstName} ${loadResult.weddingData.groomLastName} and ${loadResult.weddingData.brideFirstName} ${loadResult.weddingData.brideLastName}'s Wedding Website`,
  }
}

export default async function RootRouteHandler({ params }: RootRouteHandlerProps) {
  const { websiteSubUrl } = await params
  const { accessToken, inviteToken } = await readWebsiteVisitorCookies(websiteSubUrl)
  const loadResult = await loadWeddingBySubUrl(websiteSubUrl, accessToken, inviteToken)

  const verifyWebsitePassword = async (passwordInput: string) => {
    'use server'
    return grantWebsiteAccess(websiteSubUrl, passwordInput)
  }

  if (loadResult.status === 'not-found') return notFound()

  if (loadResult.status === 'password-required') {
    return (
      <main>
        <PasswordPage verifyWebsitePassword={verifyWebsitePassword} />
      </main>
    )
  }

  // The guest cleared the gate — greet them by name if we recognise their invite.
  const invitedHousehold = await resolveInvitedHousehold(websiteSubUrl, inviteToken)

  return (
    <main>
      <WeddingWebsite
        websiteSubUrl={websiteSubUrl}
        weddingData={loadResult.weddingData}
        invitedHousehold={invitedHousehold}
      />
    </main>
  )
}
