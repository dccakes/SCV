import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

import { clientMessages } from '~/i18n/client-messages'

export default async function WeddingWebsiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={clientMessages(messages)}>
      {/*
        Guest-facing pages keep the original styling; see globals.css. The root
        <html lang> is shared with the English-only dashboard, so tag the
        guest-facing subtree with the visitor's language for screen readers and
        search engines.
      */}
      <div data-guest-surface lang={locale} className='contents'>
        {children}
      </div>
    </NextIntlClientProvider>
  )
}
