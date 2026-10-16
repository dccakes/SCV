import { createTranslator } from 'next-intl'

import { testMessages } from '~/../tests/unit/test-utils/intl'

type TestLocale = keyof typeof testMessages

/**
 * A stand-in for `next-intl/server` backed by the real message files, for
 * server components and `generateMetadata` under Jest (which has no request
 * config). Pass a getter so a test can switch locale between cases:
 *
 *   let mockLocale: 'en' | 'es' = 'en'
 *   jest.mock('next-intl/server', () =>
 *     jest.requireActual('~/../tests/unit/test-utils/intl-server').createIntlServerMock(() => mockLocale)
 *   )
 */
export function createIntlServerMock(getLocale: () => TestLocale = () => 'en') {
  return {
    getLocale: async () => getLocale(),
    getMessages: async () => testMessages[getLocale()],
    getTranslations: async (arg?: string | { namespace?: string; locale?: TestLocale }) => {
      const namespace = typeof arg === 'string' ? arg : arg?.namespace
      const locale = (typeof arg === 'object' && arg.locale) || getLocale()
      return createTranslator({
        locale,
        messages: testMessages[locale],
        namespace: namespace as never,
      })
    },
  }
}
