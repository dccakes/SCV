import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { loadWeddingBySubUrl } from '~/app/w/[websiteSubUrl]/_lib/load-wedding-by-suburl'
import {
  grantWebsiteAccess,
  readWebsiteVisitorCookies,
} from '~/app/w/[websiteSubUrl]/_lib/website-access'
import { RsvpFormProvider } from '~/components/contexts/rsvp-form-context'
import MainRsvpForm from '~/components/website/forms/main'
import PasswordPage from '~/components/website/password-page'
import { resolveTemplate, TemplateThemeProvider } from '~/templates'

type RsvpPageProps = {
  params: Promise<{
    websiteSubUrl: string
  }>
}

export async function generateMetadata({ params }: RsvpPageProps): Promise<Metadata> {
  const { websiteSubUrl } = await params
  const { accessToken, inviteToken } = await readWebsiteVisitorCookies(websiteSubUrl)
  const loadResult = await loadWeddingBySubUrl(websiteSubUrl, accessToken, inviteToken)

  return {
    title:
      loadResult.status === 'ready'
        ? `${loadResult.weddingData.groomFirstName} ${loadResult.weddingData.groomLastName} and ${loadResult.weddingData.brideFirstName} ${loadResult.weddingData.brideLastName}'s Wedding Website`
        : 'Wedding Website',
  }
}

export default async function RsvpPage({ params }: RsvpPageProps) {
  const { websiteSubUrl } = await params
  const { accessToken, inviteToken } = await readWebsiteVisitorCookies(websiteSubUrl)
  const loadResult = await loadWeddingBySubUrl(websiteSubUrl, accessToken, inviteToken)

  const verifyWebsitePassword = async (passwordInput: string) => {
    'use server'
    return grantWebsiteAccess(websiteSubUrl, passwordInput)
  }

  if (loadResult.status === 'not-found') return notFound()
  if (loadResult.status === 'password-required') {
    return <PasswordPage verifyWebsitePassword={verifyWebsitePassword} />
  }
  if (!loadResult.weddingData.website.isRsvpEnabled) return notFound()

  const template = resolveTemplate(loadResult.weddingData.website.templateId)

  return (
    <TemplateThemeProvider template={template}>
      <RsvpFormProvider>
        <MainRsvpForm weddingData={loadResult.weddingData} basePath={`/w/${websiteSubUrl}`} />
      </RsvpFormProvider>
    </TemplateThemeProvider>
  )
}
