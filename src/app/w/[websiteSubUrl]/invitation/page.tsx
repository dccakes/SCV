import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { loadWeddingBySubUrl } from '~/app/w/[websiteSubUrl]/_lib/load-wedding-by-suburl'
import PasswordPage from '~/components/website/password-page'
import WeddingSurface from '~/components/website/wedding-surface'
import { api } from '~/trpc/server'

type InvitationPageProps = {
  params: Promise<{
    websiteSubUrl: string
  }>
}

export async function generateMetadata({ params }: InvitationPageProps): Promise<Metadata> {
  const { websiteSubUrl } = await params
  const cookieStore = await cookies()
  const accessCookieName = `wws_access_${websiteSubUrl}`
  const accessToken = cookieStore.get(accessCookieName)?.value
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
