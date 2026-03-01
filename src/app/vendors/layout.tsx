import '~/styles/globals.css'

import { Toaster } from 'sonner'

import Footer from '~/app/_components/footer'
import Navbar from '~/app/_components/navbar'
import { TRPCReactProvider } from '~/trpc/react'

export const metadata = {
  title: 'Vendors | Your Wedding Website',
  description: 'Manage your wedding vendors',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export default function VendorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <TRPCReactProvider>
      <Navbar />
      {children}
      <Footer />
      <Toaster position="top-right" richColors />
    </TRPCReactProvider>
  )
}
