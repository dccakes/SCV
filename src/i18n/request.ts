import { headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import type { Locale } from '~/lib/locale/locale-detection'

export default getRequestConfig(async () => {
  const headersList = await headers()
  const raw = headersList.get('X-Locale')
  const locale: Locale = raw === 'es' ? 'es' : 'en'
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
