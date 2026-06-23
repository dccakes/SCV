import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { loadWeddingBySubUrl } from '~/app/w/[websiteSubUrl]/_lib/load-wedding-by-suburl'
import PasswordPage from '~/components/website/password-page'
import WeddingWebsite from '~/components/website/wedding'
import { api } from '~/trpc/server'

type RootRouteHandlerProps = {
  params: Promise<{
    websiteSubUrl: string
  }>
}

export async function generateMetadata({ params }: RootRouteHandlerProps): Promise<Metadata> {
  const { websiteSubUrl } = await params
  const cookieStore = await cookies()
  const accessCookieName = `wws_access_${websiteSubUrl}`
  const accessToken = cookieStore.get(accessCookieName)?.value
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
  const accessCookieName = `wws_access_${websiteSubUrl}`
  const accessToken = cookieStore.get(accessCookieName)?.value
  const loadResult = await loadWeddingBySubUrl(websiteSubUrl, accessToken)

  const verifyWebsitePassword = async (passwordInput: string) => {
    'use server'

    const verificationToken = await api.website.verifyWebsitePassword({
      subUrl: websiteSubUrl,
      password: passwordInput,
    })

    if (!verificationToken) {
      return false
    }

    const cookieStore = await cookies()
    cookieStore.set(accessCookieName, verificationToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: `/w/${websiteSubUrl}`,
      maxAge: 60 * 60 * 6,
    })

    return true
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
