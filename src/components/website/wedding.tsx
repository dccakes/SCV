import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

import { loadWeddingBySubUrl } from '~/app/w/[websiteSubUrl]/_lib/load-wedding-by-suburl'
import WebsiteMinimalPage from '~/components/website/minimal-page'
import WeddingPage from '~/components/website/wedding-page'
import WeddingPageMobile from '~/components/website/wedding-page-mobile'

type WeddingWebsiteProps = {
  websiteSubUrl: string
  weddingData?: Awaited<ReturnType<typeof loadWeddingBySubUrl>>
}

export default async function WeddingWebsite({
  websiteSubUrl,
  weddingData: preloadedWeddingData,
}: Readonly<WeddingWebsiteProps>) {
  const headersList = await headers()
  const isMobile = headersList.get('sec-ch-ua-mobile') === '?1'
  const weddingData = preloadedWeddingData ?? (await loadWeddingBySubUrl(websiteSubUrl))

  if (weddingData === undefined) return notFound()

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
