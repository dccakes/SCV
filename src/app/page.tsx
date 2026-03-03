import type { Metadata } from 'next'
import { unstable_noStore as noStore } from 'next/cache'
import { headers } from 'next/headers'

import AuthenticatedView from '~/app/_components/home/authenticated-view'
import NonAuthenticatedView from '~/app/_components/home/non-authenticated-view'
import { auth } from '~/lib/auth'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  title: {
    absolute: 'OSWP — The Open Source Wedding Platform',
  },
  description:
    'A self-hosted platform with everything your wedding needs — invitations, RSVPs, planning, and Etta, your AI wedding planner. Deploy in minutes, own your data forever.',
  openGraph: {
    title: 'OSWP — The Open Source Wedding Platform',
    description:
      'Invitations, RSVPs, guest management, seating, vendor tracking, and Etta — your AI wedding planner. Self-host free or let us handle it.',
    url: siteUrl,
    type: 'website',
  },
  twitter: {
    title: 'OSWP — The Open Source Wedding Platform',
    description:
      'Invitations, RSVPs, guest management, and Etta — your AI wedding planner. Self-host free or let us handle it.',
  },
  alternates: {
    canonical: siteUrl,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${siteUrl}/#application`,
      name: 'OSWP',
      alternateName: 'Open Source Wedding Platform',
      url: siteUrl,
      description:
        'A modern, self-hosted wedding planning platform with invitations, RSVPs, guest management, and Etta — your AI wedding planner.',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      isAccessibleForFree: true,
      license: 'https://fsl.software/FSL-1.1-MIT.template.md',
      featureList: [
        'Smart Invitations',
        'RSVP Management',
        'Planning Board',
        'Seating & Logistics',
        'Vendor Hub',
        'Wedding Website Builder',
        'AI Wedding Planner (Etta)',
      ],
      offers: [
        {
          '@type': 'Offer',
          name: 'Community',
          description: 'Self-hosted, free forever. Full source code access with no limits.',
          price: '0',
          priceCurrency: 'GBP',
        },
        {
          '@type': 'Offer',
          name: 'Couple',
          description:
            'Fully managed cloud hosting with automated backups and Etta included.',
          price: '12',
          priceCurrency: 'GBP',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '12',
            priceCurrency: 'GBP',
            unitCode: 'MON',
            referenceQuantity: {
              '@type': 'QuantitativeValue',
              value: '1',
              unitCode: 'MON',
            },
          },
        },
        {
          '@type': 'Offer',
          name: 'Planner',
          description:
            'For wedding planners managing multiple couples. White-label ready with SLA guarantee.',
          price: '49',
          priceCurrency: 'GBP',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '49',
            priceCurrency: 'GBP',
            unitCode: 'MON',
            referenceQuantity: {
              '@type': 'QuantitativeValue',
              value: '1',
              unitCode: 'MON',
            },
          },
        },
      ],
      provider: {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
      },
    },
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'OSWP',
      url: siteUrl,
      sameAs: ['https://github.com/dccakes/SCV'],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: 'OSWP',
      url: siteUrl,
      description:
        'The Open Source Wedding Platform — invitations, RSVPs, planning, and an AI wedding planner.',
      publisher: {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
      },
    },
  ],
}

export default async function Home() {
  noStore()

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const isSignedIn = !!session

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {!isSignedIn ? <NonAuthenticatedView /> : <AuthenticatedView />}
    </>
  )
}
