import { type Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

import { RsvpFormProvider } from '~/app/_components/contexts/rsvp-form-context'
import MainRsvpForm from '~/app/_components/website/forms/main'
import { api } from '~/trpc/server'

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const path = headersList.get('x-url')
  const websiteSubUrl = path?.replace('/', '').replace('/rsvp', '') ?? ''
  const weddingData = await api.website.fetchWeddingData
    .query({ subUrl: websiteSubUrl })
    .catch(() => undefined)

  return {
    title: weddingData
      ? `${weddingData.groomFirstName} ${weddingData.groomLastName} and ${weddingData.brideFirstName} ${weddingData.brideLastName}'s Wedding Website`
      : 'Wedding Website',
  }
}

export default async function RsvpPage() {
  const headersList = await headers()
  const path = headersList.get('x-url')
  const websiteSubUrl = path?.replace('/', '').replace('/rsvp', '') ?? ''

  const weddingData = await api.website.fetchWeddingData
    .query({ subUrl: websiteSubUrl })
    .catch(() => undefined)

  if (!weddingData?.website.isRsvpEnabled) return notFound()

  return (
    <RsvpFormProvider>
      <MainRsvpForm weddingData={weddingData} basePath={`/${websiteSubUrl ?? ''}`} />
    </RsvpFormProvider>
  )
}
