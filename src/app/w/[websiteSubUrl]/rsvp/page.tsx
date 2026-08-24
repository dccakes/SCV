import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { loadVisitorWedding } from '~/app/w/[websiteSubUrl]/_lib/load-visitor-wedding'
import { resolveRecognizedRsvpHousehold } from '~/app/w/[websiteSubUrl]/_lib/recognized-rsvp-household'
import { grantWebsiteAccess } from '~/app/w/[websiteSubUrl]/_lib/website-access'
import { RsvpFormProvider } from '~/components/contexts/rsvp-form-context'
import MainRsvpForm from '~/components/website/forms/main'
import PasswordPage from '~/components/website/password-page'
import RsvpNotAcceptingMessage from '~/components/website/rsvp-not-accepting-message'
import { resolveTemplate, TemplateThemeProvider } from '~/templates'

type RsvpPageProps = {
  params: Promise<{
    websiteSubUrl: string
  }>
}

export async function generateMetadata({ params }: RsvpPageProps): Promise<Metadata> {
  const { websiteSubUrl } = await params
  const { loadResult } = await loadVisitorWedding(websiteSubUrl)

  // Nested `icon.tsx` route conventions are silently dropped whenever an
  // ancestor layout (the root layout, here) sets `metadata.icons` explicitly —
  // Next.js then stops auto-merging file-based icons for the whole subtree.
  // Re-declaring `icons` at this segment reclaims it and points back at our
  // per-website favicon route, matching the wedding page.
  const iconUrl = `/w/${websiteSubUrl}/icon`

  let title = 'RSVP'
  if (loadResult.status === 'ready') {
    const { groomFirstName, groomLastName, brideFirstName, brideLastName } = loadResult.weddingData
    const groomName = groomFirstName && groomLastName ? `${groomFirstName} ${groomLastName}` : ''
    const brideName = brideFirstName && brideLastName ? `${brideFirstName} ${brideLastName}` : ''
    const coupleName =
      groomName && brideName ? `${groomName} & ${brideName}` : groomName || brideName
    if (coupleName) title = `${coupleName} — RSVP`
  }

  return {
    title,
    icons: [{ rel: 'icon', url: iconUrl, type: 'image/png', sizes: '32x32' }],
  }
}

export default async function RsvpPage({ params }: RsvpPageProps) {
  const { websiteSubUrl } = await params
  const { loadResult, inviteToken } = await loadVisitorWedding(websiteSubUrl)

  const verifyWebsitePassword = async (passwordInput: string) => {
    'use server'
    return grantWebsiteAccess(websiteSubUrl, passwordInput)
  }

  if (loadResult.status === 'not-found') return notFound()
  if (loadResult.status === 'password-required') {
    return <PasswordPage verifyWebsitePassword={verifyWebsitePassword} />
  }

  const template = resolveTemplate(loadResult.weddingData.website.templateId)

  if (!loadResult.weddingData.website.isRsvpEnabled) {
    return (
      <TemplateThemeProvider template={template}>
        <RsvpNotAcceptingMessage basePath={`/w/${websiteSubUrl}`} />
      </TemplateThemeProvider>
    )
  }

  // The guest cleared the gate — if we recognize their save-the-date invite,
  // skip the name search and drop them straight onto the confirm step.
  const recognizedHousehold = await resolveRecognizedRsvpHousehold(websiteSubUrl, inviteToken)

  return (
    <TemplateThemeProvider template={template}>
      <RsvpFormProvider recognizedHousehold={recognizedHousehold}>
        <MainRsvpForm weddingData={loadResult.weddingData} basePath={`/w/${websiteSubUrl}`} />
      </RsvpFormProvider>
    </TemplateThemeProvider>
  )
}
