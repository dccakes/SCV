import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { loadWeddingBySubUrl } from '~/app/w/[websiteSubUrl]/_lib/load-wedding-by-suburl'
import {
  grantWebsiteAccess,
  readWebsiteVisitorCookies,
} from '~/app/w/[websiteSubUrl]/_lib/website-access'
import PasswordPage from '~/components/website/password-page'
import WeddingSurface from '~/components/website/wedding-surface'

type SaveTheDatePageProps = {
  params: Promise<{
    websiteSubUrl: string
  }>
}

export async function generateMetadata({ params }: SaveTheDatePageProps): Promise<Metadata> {
  const { websiteSubUrl } = await params
  const { accessToken, inviteToken } = await readWebsiteVisitorCookies(websiteSubUrl)
  const loadResult = await loadWeddingBySubUrl(websiteSubUrl, accessToken, inviteToken)

  return {
    title:
      loadResult.status === 'ready'
        ? `Save the Date — ${loadResult.weddingData.groomFirstName} & ${loadResult.weddingData.brideFirstName}`
        : 'Save the Date',
  }
}

export default async function SaveTheDatePage({ params }: SaveTheDatePageProps) {
  const { websiteSubUrl } = await params
  const { accessToken, inviteToken } = await readWebsiteVisitorCookies(websiteSubUrl)
  const loadResult = await loadWeddingBySubUrl(websiteSubUrl, accessToken, inviteToken)

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
      surface='SaveTheDate'
    />
  )
}
