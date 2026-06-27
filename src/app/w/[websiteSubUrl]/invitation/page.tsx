import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { loadWeddingBySubUrl } from '~/app/w/[websiteSubUrl]/_lib/load-wedding-by-suburl'
import {
  grantWebsiteAccess,
  websiteAccessCookieName,
} from '~/app/w/[websiteSubUrl]/_lib/website-access'
import PasswordPage from '~/components/website/password-page'
import WeddingSurface from '~/components/website/wedding-surface'

type InvitationPageProps = {
  params: Promise<{
    websiteSubUrl: string
  }>
}

export async function generateMetadata({ params }: InvitationPageProps): Promise<Metadata> {
  const { websiteSubUrl } = await params
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(websiteAccessCookieName(websiteSubUrl))?.value
  const loadResult = await loadWeddingBySubUrl(websiteSubUrl, accessToken)

  return {
    title:
      loadResult.status === 'ready'
        ? `Invitation — ${loadResult.weddingData.groomFirstName} & ${loadResult.weddingData.brideFirstName}`
        : 'Invitation',
  }
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { websiteSubUrl } = await params
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(websiteAccessCookieName(websiteSubUrl))?.value
  const loadResult = await loadWeddingBySubUrl(websiteSubUrl, accessToken)

  const verifyWebsitePassword = async (passwordInput: string) => {
    'use server'
    return grantWebsiteAccess(websiteSubUrl, passwordInput)
  }

  if (loadResult.status === 'not-found') return notFound()
  if (loadResult.status === 'password-required') {
    return <PasswordPage verifyWebsitePassword={verifyWebsitePassword} />
  }

  return (
    <WeddingSurface
      websiteSubUrl={websiteSubUrl}
      weddingData={loadResult.weddingData}
      surface='Invitation'
    />
  )
}
