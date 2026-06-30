import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { loadVisitorWedding } from '~/app/w/[websiteSubUrl]/_lib/load-visitor-wedding'
import { grantWebsiteAccess } from '~/app/w/[websiteSubUrl]/_lib/website-access'
import PasswordPage from '~/components/website/password-page'
import WeddingSurface from '~/components/website/wedding-surface'

type InvitationPageProps = {
  params: Promise<{
    websiteSubUrl: string
  }>
}

export async function generateMetadata({ params }: InvitationPageProps): Promise<Metadata> {
  const { websiteSubUrl } = await params
  const { loadResult } = await loadVisitorWedding(websiteSubUrl)

  return {
    title:
      loadResult.status === 'ready'
        ? `Invitation — ${loadResult.weddingData.groomFirstName} & ${loadResult.weddingData.brideFirstName}`
        : 'Invitation',
  }
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { websiteSubUrl } = await params
  const { loadResult } = await loadVisitorWedding(websiteSubUrl)

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
