import '~/styles/globals.css'

import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, DM_Mono, Instrument_Serif } from 'next/font/google'
import { Toaster as SonnerToaster } from 'sonner'

import { EventFormProvider } from '~/components/contexts/event-form-context'
import { GuestFormProvider } from '~/components/contexts/guest-form-context'
import { Providers } from '~/app/providers'
import { Toaster } from '~/components/ui/toaster'
import { TRPCReactProvider } from '~/trpc/react'

// Design fonts matching the HTML prototype
const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-instrument',
  display: 'swap',
})

export const viewport: Viewport = {
  initialScale: 1,
  width: 'device-width',
}

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'OSWP — The Open Source Wedding Platform',
    template: '%s | OSWP',
  },
  description:
    'A modern, self-hosted wedding planning platform with invitations, RSVPs, guest management, and Etta — your AI wedding planner. Free and open source.',
  keywords: [
    'wedding planning',
    'RSVP management',
    'wedding invitations',
    'guest list management',
    'open source wedding',
    'self-hosted wedding platform',
    'wedding website builder',
    'AI wedding planner',
    'seating arrangement',
    'vendor management',
  ],
  authors: [{ name: 'OSWP', url: 'https://github.com/dccakes/SCV' }],
  creator: 'OSWP',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'OSWP',
    title: 'OSWP — The Open Source Wedding Platform',
    description:
      'A modern, self-hosted wedding planning platform with invitations, RSVPs, guest management, and Etta — your AI wedding planner.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OSWP — The Open Source Wedding Platform',
    description:
      'Self-hosted wedding planning with invitations, RSVPs, and Etta — your AI wedding planner. Free and open source.',
  },
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang='en'
      suppressHydrationWarning
      className={`${cormorantGaramond.variable} ${dmMono.variable} ${instrumentSerif.variable} font-serif antialiased`}
    >
      <body className='bg-background font-serif text-foreground antialiased'>
        <Providers>
          <TRPCReactProvider>
            <EventFormProvider>
              <GuestFormProvider>
                {children}
                <Toaster />
                <SonnerToaster richColors position='top-right' />
              </GuestFormProvider>
            </EventFormProvider>
          </TRPCReactProvider>
        </Providers>
      </body>
    </html>
  )
}
