import '~/styles/globals.css'

import { Inter } from "next/font/google";
import { type Viewport } from 'next/types'

import { EventFormProvider } from '~/app/_components/contexts/event-form-context'
import { GuestFormProvider } from '~/app/_components/contexts/guest-form-context'
import { Providers } from '~/app/providers'
import { Toaster } from '~/components/ui/toaster'
import { TRPCReactProvider } from '~/trpc/react'

const inter = Inter({
   subsets: ["latin"],
   variable: "--font-sans",
 });

export const viewport: Viewport = {
  initialScale: 1,
  width: 'device-width',
}

export const metadata = {
  title: 'OSWP - The Open Source Wedding Project',
  description: 'A modern, open-source wedding planning and RSVP management system',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Providers>
          <TRPCReactProvider>
            <EventFormProvider>
              <GuestFormProvider>
                {children}
                <Toaster />
              </GuestFormProvider>
            </EventFormProvider>
          </TRPCReactProvider>
        </Providers>
      </body>
    </html>
  )
}
