import '~/styles/globals.css'

import { Toaster } from 'sonner'

import Footer from '~/app/_components/footer'
import GuestHeader from '~/app/_components/guest-list/header'
import Navbar from '~/app/_components/navbar'
import { TRPCReactProvider } from '~/trpc/react'

export const metadata = {
  title: 'Your Wedding Website',
  description: 'dashboard',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export default function GuestListLayout({ children }: { children: React.ReactNode }) {
  return (
    <TRPCReactProvider>
      <Navbar />
      <GuestHeader />
      {children}
      <Footer />
      <Toaster position="top-right" richColors />
    </TRPCReactProvider>
  )
}
