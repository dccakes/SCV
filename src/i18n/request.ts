import { headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { loadMessages } from '~/i18n/load-messages'
import { toLocale } from '~/lib/locale/locale-detection'

export default getRequestConfig(async () => {
  const headersList = await headers()
  const raw = headersList.get('X-Locale')
  const locale = toLocale(raw)
  return {
    locale,
    messages: await loadMessages(locale),
  }
})
