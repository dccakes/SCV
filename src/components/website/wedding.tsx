import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

import { loadWeddingBySubUrl } from '~/app/[websiteSubUrl]/_lib/load-wedding-by-suburl'
import WeddingPage from '~/components/website/wedding-page'
import WeddingPageMobile from '~/components/website/wedding-page-mobile'

type WeddingWebsiteProps = {
  websiteSubUrl: string
}

export default async function WeddingWebsite({ websiteSubUrl }: Readonly<WeddingWebsiteProps>) {
  const headersList = await headers()
  const isMobile = headersList.get('sec-ch-ua-mobile') === '?1'
  const weddingData = await loadWeddingBySubUrl(websiteSubUrl)

  if (weddingData === undefined) return notFound()

  const path = `/${websiteSubUrl}`

  return isMobile ? (
    <WeddingPageMobile weddingData={weddingData} path={path} />
  ) : (
    <WeddingPage weddingData={weddingData} path={path} />
  )
}
