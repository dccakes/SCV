// Test the logic directly (not the middleware function — that requires Next.js runtime)

import type { Locale } from '~/lib/locale/locale-detection'
import { getLocaleFromCountry } from '~/lib/locale/locale-detection'

function resolveLocale(langOverrideCookie: string | undefined, countryCode: string | null): Locale {
  if (langOverrideCookie === 'en' || langOverrideCookie === 'es') return langOverrideCookie
  return getLocaleFromCountry(countryCode)
}

describe('locale resolution', () => {
  it('should use lang-override cookie when set to en', () => {
    expect(resolveLocale('en', 'MX')).toBe('en')
  })
  it('should use lang-override cookie when set to es', () => {
    expect(resolveLocale('es', 'US')).toBe('es')
  })
  it('should fall back to geo when no override', () => {
    expect(resolveLocale(undefined, 'MX')).toBe('es')
    expect(resolveLocale(undefined, 'US')).toBe('en')
  })
  it('should ignore invalid override values', () => {
    expect(resolveLocale('fr', 'MX')).toBe('es')
    expect(resolveLocale('invalid', 'US')).toBe('en')
  })
})
