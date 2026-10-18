import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

export default async function WeddingWebsiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {/* Guest-facing pages keep the original styling; see globals.css. */}
      <div data-guest-surface className='contents'>
        {children}
      </div>
    </NextIntlClientProvider>
  )
}
