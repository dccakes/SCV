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

type SaveTheDatePageProps = {
  params: Promise<{
    websiteSubUrl: string
  }>
}

export async function generateMetadata({ params }: SaveTheDatePageProps): Promise<Metadata> {
  const { websiteSubUrl } = await params
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(websiteAccessCookieName(websiteSubUrl))?.value
  const loadResult = await loadWeddingBySubUrl(websiteSubUrl, accessToken)

  return {
    title:
      loadResult.status === 'ready'
        ? `Save the Date — ${loadResult.weddingData.groomFirstName} & ${loadResult.weddingData.brideFirstName}`
        : 'Save the Date',
  }
}

export default async function SaveTheDatePage({ params }: SaveTheDatePageProps) {
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
      surface='SaveTheDate'
    />
  )
}
