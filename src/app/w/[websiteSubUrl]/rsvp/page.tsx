import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { loadWeddingBySubUrl } from '~/app/w/[websiteSubUrl]/_lib/load-wedding-by-suburl'
import { RsvpFormProvider } from '~/components/contexts/rsvp-form-context'
import MainRsvpForm from '~/components/website/forms/main'

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
  const weddingData = await loadWeddingBySubUrl(websiteSubUrl, accessToken)

  return {
    title: weddingData
      ? `${weddingData.groomFirstName} ${weddingData.groomLastName} and ${weddingData.brideFirstName} ${weddingData.brideLastName}'s Wedding Website`
      : 'Wedding Website',
  }
}

export default async function RsvpPage({ params }: RsvpPageProps) {
  const { websiteSubUrl } = await params
  const cookieStore = await cookies()
  const accessCookieName = `wws_access_${websiteSubUrl}`
  const accessToken = cookieStore.get(accessCookieName)?.value
  const weddingData = await loadWeddingBySubUrl(websiteSubUrl, accessToken)

  if (!weddingData?.website.isRsvpEnabled) return notFound()

  return (
    <RsvpFormProvider>
      <MainRsvpForm weddingData={weddingData} basePath={`/w/${websiteSubUrl ?? ''}`} />
    </RsvpFormProvider>
  )
}
