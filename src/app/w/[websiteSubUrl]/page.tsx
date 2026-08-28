import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { resolveInvitedHousehold } from '~/app/w/[websiteSubUrl]/_lib/invited-household'
import { loadVisitorWedding } from '~/app/w/[websiteSubUrl]/_lib/load-visitor-wedding'
import { grantWebsiteAccess } from '~/app/w/[websiteSubUrl]/_lib/website-access'
import PasswordPage from '~/components/website/password-page'
import WeddingWebsite from '~/components/website/wedding'

type RootRouteHandlerProps = {
  params: Promise<{
    websiteSubUrl: string
  }>
}

export async function generateMetadata({ params }: RootRouteHandlerProps): Promise<Metadata> {
  const { websiteSubUrl } = await params
  const { loadResult } = await loadVisitorWedding(websiteSubUrl)

  // Nested `icon.tsx` route conventions are silently dropped whenever an
  // ancestor layout (the root layout, here) sets `metadata.icons` explicitly —
  // Next.js then stops auto-merging file-based icons for the whole subtree.
  // Re-declaring `icons` at this segment reclaims it and points back at our
  // per-website favicon route.
  const iconUrl = `/w/${websiteSubUrl}/icon`

  if (loadResult.status !== 'ready') {
    return {
      title: 'Wedding Website',
      icons: [{ rel: 'icon', url: iconUrl, type: 'image/png', sizes: '32x32' }],
    }
  }

  const {
    brideFirstName,
    brideLastName,
    groomFirstName,
    groomLastName,
    website: { introText },
  } = loadResult.weddingData

  const brideName = brideFirstName && brideLastName ? `${brideFirstName} ${brideLastName}` : ''
  const groomName = groomFirstName && groomLastName ? `${groomFirstName} ${groomLastName}` : ''
  const title = brideName && groomName ? `${brideName} & ${groomName} Wedding` : 'Wedding Website'
  const description = introText || `Join us for the wedding of ${brideName} and ${groomName}.`

  const ogImageUrl = `/api/og/wedding/${websiteSubUrl}`

  return {
    title,
    description,
    icons: [{ rel: 'icon', url: iconUrl, type: 'image/png', sizes: '32x32' }],
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function RootRouteHandler({ params }: RootRouteHandlerProps) {
  const { websiteSubUrl } = await params
  const { loadResult, inviteToken } = await loadVisitorWedding(websiteSubUrl)

  const verifyWebsitePassword = async (passwordInput: string) => {
    'use server'
    return grantWebsiteAccess(websiteSubUrl, passwordInput)
  }

  if (loadResult.status === 'not-found') return notFound()

  if (loadResult.status === 'password-required') {
    return (
      <main>
        <PasswordPage verifyWebsitePassword={verifyWebsitePassword} />
      </main>
    )
  }

  // The guest cleared the gate — greet them by name if we recognise their invite.
  const invitedHousehold = await resolveInvitedHousehold(websiteSubUrl, inviteToken)

  return (
    <main>
      <WeddingWebsite
        websiteSubUrl={websiteSubUrl}
        weddingData={loadResult.weddingData}
        invitedHousehold={invitedHousehold}
      />
    </main>
  )
}
