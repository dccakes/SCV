import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

import WeddingPage from '~/app/_components/website/wedding-page'
import WeddingPageMobile from '~/app/_components/website/wedding-page-mobile'
import { api } from '~/trpc/server'

export default async function WeddingWebsite() {
  const headersList = await headers()
  // headersList.forEach((k, h) => {
  //   console.log("headerz", `${h}: ${k}`);
  // });
  const websiteSubUrl = headersList.get('x-url')
  // const userAgent = headersList.get("user-agent");
  const isMobile = headersList.get('sec-ch-ua-mobile') === '?1'

  const weddingData = await api.website.fetchWeddingData
    .query({
      subUrl: websiteSubUrl?.replace('/', '') ?? '',
    })
    .catch(() => undefined)

  if (weddingData === undefined) return notFound()

  return isMobile ? (
    <WeddingPageMobile weddingData={weddingData} path={websiteSubUrl ?? ''} />
  ) : (
    <WeddingPage weddingData={weddingData} path={websiteSubUrl ?? ''} />
  )
}
