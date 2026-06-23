import { headers } from 'next/headers'
import WebsiteMinimalPage from '~/components/website/minimal-page'
import WeddingPage from '~/components/website/wedding-page'
import WeddingPageMobile from '~/components/website/wedding-page-mobile'
import type { WeddingPageData } from '~/server/domains/website/website.types'

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

  if (!websiteBuilderEnabled) {
    return (
      <WebsiteMinimalPage
        coupleNames={`${weddingData.groomFirstName} & ${weddingData.brideFirstName}`}
        isRsvpEnabled={weddingData.website.isRsvpEnabled}
        path={path}
      />
    )
  }

  return isMobile ? (
    <WeddingPageMobile weddingData={weddingData} path={path} introText={introText} />
  ) : (
    <WeddingPage weddingData={weddingData} path={path} introText={introText} />
  )
}
