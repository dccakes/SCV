import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { loadWeddingBySubUrl } from '~/app/w/[websiteSubUrl]/_lib/load-wedding-by-suburl'
import { RsvpFormProvider } from '~/components/contexts/rsvp-form-context'
import MainRsvpForm from '~/components/website/forms/main'
import PasswordPage from '~/components/website/password-page'
import { api } from '~/trpc/server'

type RsvpPageProps = {
  params: Promise<{
    websiteSubUrl: string
  }>
}

export async function generateMetadata({ params }: RsvpPageProps): Promise<Metadata> {
  const { websiteSubUrl } = await params
  const cookieStore = await cookies()
  const accessCookieName = `wws_access_${websiteSubUrl}`
  const accessToken = cookieStore.get(accessCookieName)?.value
  const loadResult = await loadWeddingBySubUrl(websiteSubUrl, accessToken)

  return {
    title:
      loadResult.status === 'ready'
        ? `${loadResult.weddingData.groomFirstName} ${loadResult.weddingData.groomLastName} and ${loadResult.weddingData.brideFirstName} ${loadResult.weddingData.brideLastName}'s Wedding Website`
        : 'Wedding Website',
  }
}

export default async function RsvpPage({ params }: RsvpPageProps) {
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
  if (!loadResult.weddingData.website.isRsvpEnabled) return notFound()

  return (
    <RsvpFormProvider>
      <MainRsvpForm weddingData={loadResult.weddingData} basePath={`/w/${websiteSubUrl ?? ''}`} />
    </RsvpFormProvider>
  )
}
