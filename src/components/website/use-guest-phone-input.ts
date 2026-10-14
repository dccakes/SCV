'use client'

import { useLocale, useTranslations } from 'next-intl'

import type { PhoneInputLabels } from '~/components/ui/phone-input'
import { type Locale, toLocale } from '~/lib/locale/locale-detection'

/** Locale and picker copy for a `PhoneInput` shown to guests. */
export function useGuestPhoneInput(): { locale: Locale; labels: PhoneInputLabels } {
  const t = useTranslations('site.phoneInput')
  return {
    locale: toLocale(useLocale()),
    labels: {
      selectCountry: t('selectCountry'),
      searchCountries: t('searchCountries'),
      countryCodes: t('countryCodes'),
      noCountries: t('noCountries'),
    },
  }
}
