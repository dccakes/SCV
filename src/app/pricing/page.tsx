import type { Metadata } from 'next'

import PricingSection from '~/components/marketing/pricing-section'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

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
