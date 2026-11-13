import '~/styles/globals.css'

import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Toaster as SonnerToaster } from 'sonner'

import { Providers } from '~/app/providers'
import { Toaster } from '~/components/ui/toaster'
import { areSignupsAllowed } from '~/lib/signups'
import { TRPCReactProvider } from '~/trpc/react'

// Design fonts matching the HTML prototype. Self-hosted (src/fonts) so builds
// never depend on reaching Google Fonts; see src/templates/fonts.ts.
const dmMono = localFont({
  src: [
    { path: '../fonts/dm-mono/dm-mono-300-normal.woff2', weight: '300', style: 'normal' },
    { path: '../fonts/dm-mono/dm-mono-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/dm-mono/dm-mono-500-normal.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-dm-mono',
  display: 'swap',
  adjustFontFallback: 'Arial',
})

const instrumentSerif = localFont({
  src: [
    {
      path: '../fonts/instrument-serif/instrument-serif-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/instrument-serif/instrument-serif-400-italic.woff2',
      weight: '400',
      style: 'italic',
    },
  ],
  variable: '--font-instrument',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
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
      className={`${dmMono.variable} ${instrumentSerif.variable} font-serif antialiased`}
    >
      <body className='bg-background font-serif text-foreground antialiased'>
        <Providers signupsEnabled={areSignupsAllowed()}>
          <TRPCReactProvider>
            {children}
            <Toaster />
            <SonnerToaster richColors position='top-right' />
          </TRPCReactProvider>
        </Providers>
      </body>
    </html>
  )
}
