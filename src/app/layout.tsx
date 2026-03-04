import '~/styles/globals.css'

import type { Metadata, Viewport } from 'next'
import { Toaster as SonnerToaster } from 'sonner'

import { EventFormProvider } from '~/app/_components/contexts/event-form-context'
import { GuestFormProvider } from '~/app/_components/contexts/guest-form-context'
import { Providers } from '~/app/providers'
import { Toaster } from '~/components/ui/toaster'
import { TRPCReactProvider } from '~/trpc/react'

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
    <html lang='en' suppressHydrationWarning>
      <body className='bg-background font-sans text-foreground antialiased'>
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
