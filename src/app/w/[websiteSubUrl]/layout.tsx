import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

import { LocaleToggle } from '~/components/locale-toggle'

export default async function WeddingWebsiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className='fixed top-4 right-4 z-50'>
        <LocaleToggle />
      </div>
      {children}
    </NextIntlClientProvider>
  )
}
