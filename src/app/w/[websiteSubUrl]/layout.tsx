import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

export default async function WeddingWebsiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {/*
        The root <html lang> is shared with the English-only dashboard, so tag the
        guest-facing subtree with the visitor's language for screen readers and
        search engines.
      */}
      <div lang={locale}>{children}</div>
    </NextIntlClientProvider>
  )
}
