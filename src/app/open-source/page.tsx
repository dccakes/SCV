import type { Metadata } from 'next'

import OpenSourceSection from '~/components/marketing/open-source-section'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  title: 'OSWP Open Source',
  description:
    'Explore the OSWP open source mission, contribution workflow, and self-hosting resources.',
  alternates: {
    canonical: `${siteUrl}/open-source`,
  },
}

export default function OpenSourcePage() {
  return (
    <main className='bg-background text-foreground'>
      <OpenSourceSection includeLongForm />
    </main>
  )
}
