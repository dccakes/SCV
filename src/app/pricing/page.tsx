import type { Metadata } from 'next'

import PricingSection from '~/components/marketing/pricing-section'
import { getPublicWebsiteBaseUrl } from '~/lib/website/public-url'

const siteUrl = getPublicWebsiteBaseUrl()

export const metadata: Metadata = {
  title: 'OSWP Pricing',
  description: 'Self-host OSWP for free or choose managed cloud plans for couples and planners.',
  alternates: {
    canonical: `${siteUrl}/pricing`,
  },
}

export default function PricingPage() {
  return (
    <main className='bg-background text-foreground'>
      <PricingSection />
    </main>
  )
}
