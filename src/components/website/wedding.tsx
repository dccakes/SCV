import { headers } from 'next/headers'
import type { WeddingPageData } from '~/server/domains/website/website.types'
import { resolveTemplate, TemplateThemeProvider } from '~/templates'

type WeddingWebsiteProps = {
  websiteSubUrl: string
  weddingData: WeddingPageData
}

export default async function WeddingWebsite({
  websiteSubUrl,
  weddingData,
}: Readonly<WeddingWebsiteProps>) {
  const headersList = await headers()
  const isMobile = headersList.get('sec-ch-ua-mobile') === '?1'

  const path = `/w/${websiteSubUrl}`
  const websiteBuilderEnabled = weddingData.websiteBuilderEnabled
  const introText = weddingData.website.introText.trim() ? weddingData.website.introText : undefined

  const template = resolveTemplate(weddingData.website.templateId)
  const { Home, HomeMobile, Minimal } = template.components

  if (!websiteBuilderEnabled) {
    return (
      <TemplateThemeProvider template={template}>
        <Minimal
          coupleNames={`${weddingData.groomFirstName} & ${weddingData.brideFirstName}`}
          isRsvpEnabled={weddingData.website.isRsvpEnabled}
          path={path}
        />
      </TemplateThemeProvider>
    )
  }

  return (
    <TemplateThemeProvider template={template}>
      {isMobile ? (
        <HomeMobile weddingData={weddingData} path={path} introText={introText} />
      ) : (
        <Home weddingData={weddingData} path={path} introText={introText} />
      )}
    </TemplateThemeProvider>
  )
}
