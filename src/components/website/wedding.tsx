import { headers } from 'next/headers'
import type { InvitedHousehold } from '~/app/w/[websiteSubUrl]/_lib/invited-household'
import { PersonalizedWelcome } from '~/components/website/personalized-welcome'
import { formatCoupleNames } from '~/lib/couple-names'
import type { WeddingPageData } from '~/server/domains/website/website.types'
import { resolveTemplate, TemplateThemeProvider } from '~/templates'

type WeddingWebsiteProps = {
  websiteSubUrl: string
  weddingData: WeddingPageData
  /** Set when the visitor is a guest we recognised from their invite link. */
  invitedHousehold?: InvitedHousehold | null
}

export default async function WeddingWebsite({
  websiteSubUrl,
  weddingData,
  invitedHousehold,
}: Readonly<WeddingWebsiteProps>) {
  const headersList = await headers()
  const isMobile = headersList.get('sec-ch-ua-mobile') === '?1'

  const path = `/w/${websiteSubUrl}`
  const websiteBuilderEnabled = weddingData.websiteBuilderEnabled
  const introText = weddingData.website.introText.trim() ? weddingData.website.introText : undefined

  const template = resolveTemplate(weddingData.website.templateId)
  const { Home, HomeMobile, Minimal } = template.components

  const welcome = invitedHousehold ? (
    <PersonalizedWelcome invitedHousehold={invitedHousehold} />
  ) : null

  if (!websiteBuilderEnabled) {
    return (
      <TemplateThemeProvider template={template}>
        {welcome}
        <Minimal
          coupleNames={formatCoupleNames(weddingData, weddingData.nameDisplayOrder)}
          isRsvpEnabled={weddingData.website.isRsvpEnabled}
          path={path}
        />
      </TemplateThemeProvider>
    )
  }

  return (
    <TemplateThemeProvider template={template}>
      {welcome}
      {isMobile ? (
        <HomeMobile weddingData={weddingData} path={path} introText={introText} />
      ) : (
        <Home weddingData={weddingData} path={path} introText={introText} />
      )}
    </TemplateThemeProvider>
  )
}
