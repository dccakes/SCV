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
  const weddingData = await loadWeddingBySubUrl(websiteSubUrl, accessToken)

  if (!weddingData) {
    return {
      title: 'Wedding Website',
    }
  }

  return {
    title: `${weddingData.groomFirstName} ${weddingData.groomLastName} and ${weddingData.brideFirstName} ${weddingData.brideLastName}'s Wedding Website`,
  }
}

export default async function RootRouteHandler({ params }: RootRouteHandlerProps) {
  const { websiteSubUrl } = await params
  const cookieStore = await cookies()
  const accessCookieName = `wws_access_${websiteSubUrl}`
  const accessToken = cookieStore.get(accessCookieName)?.value
  const weddingData = await loadWeddingBySubUrl(websiteSubUrl, accessToken)

  if (!weddingData) {
    const website = await api.website.getBySubUrl({
      subUrl: websiteSubUrl,
    })
    if (website === null) return notFound()
  }

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

  return (
    <main>
      {weddingData ? (
        <WeddingWebsite websiteSubUrl={websiteSubUrl} weddingData={weddingData} />
      ) : (
        <PasswordPage verifyWebsitePassword={verifyWebsitePassword} />
      )}
    </main>
  )
}
