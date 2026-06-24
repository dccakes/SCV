import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { loadWeddingBySubUrl } from '~/app/w/[websiteSubUrl]/_lib/load-wedding-by-suburl'
import {
  grantWebsiteAccess,
  websiteAccessCookieName,
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
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(websiteAccessCookieName(websiteSubUrl))?.value
  const loadResult = await loadWeddingBySubUrl(websiteSubUrl, accessToken)

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
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(websiteAccessCookieName(websiteSubUrl))?.value
  const loadResult = await loadWeddingBySubUrl(websiteSubUrl, accessToken)

  const verifyWebsitePassword = async (passwordInput: string) => {
    'use server'
    return grantWebsiteAccess(websiteSubUrl, passwordInput)
  }

  if (loadResult.status === 'not-found') return notFound()

  return (
    <main>
      {loadResult.status === 'password-required' ? (
        <PasswordPage verifyWebsitePassword={verifyWebsitePassword} />
      ) : (
        <WeddingWebsite websiteSubUrl={websiteSubUrl} weddingData={loadResult.weddingData} />
      )}
    </main>
  )
}
