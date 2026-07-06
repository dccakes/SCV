import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { loadVisitorWedding } from '~/app/w/[websiteSubUrl]/_lib/load-visitor-wedding'
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
  const { loadResult } = await loadVisitorWedding(websiteSubUrl)

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

  return (
    <TemplateThemeProvider template={template}>
      <RsvpFormProvider>
        <MainRsvpForm weddingData={loadResult.weddingData} basePath={`/w/${websiteSubUrl}`} />
      </RsvpFormProvider>
    </TemplateThemeProvider>
  )
}
