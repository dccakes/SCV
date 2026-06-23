import Image from 'next/image'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

import DefaultBanner from '~/components/images/default-banner.jpg'
import { LocaleToggle } from '~/components/locale-toggle'

export default async function WeddingWebsiteLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className='relative h-48 w-full'>
        <Image
          alt='Pink Romantic Fresh Art Wedding Banner Background from pngtree.com'
          src={DefaultBanner}
          fill
          priority
          sizes='100vw'
          className='object-cover'
        />
      </div>
      <div className='absolute top-4 right-4 z-10'>
        <LocaleToggle />
      </div>
      {children}
    </NextIntlClientProvider>
  )
}
