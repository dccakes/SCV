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

  return {
    title:
      loadResult.status === 'ready'
        ? `${loadResult.weddingData.groomFirstName} ${loadResult.weddingData.groomLastName} and ${loadResult.weddingData.brideFirstName} ${loadResult.weddingData.brideLastName}'s Wedding Website`
        : 'Wedding Website',
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
