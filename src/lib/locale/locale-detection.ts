export const SPANISH_COUNTRY_CODES = new Set([
  'MX',
  'ES',
  'AR',
  'CO',
  'CL',
  'PE',
  'VE',
  'EC',
  'BO',
  'PY',
  'UY',
  'GT',
  'SV',
  'HN',
  'NI',
  'CR',
  'PA',
  'CU',
  'DO',
  'PR',
  'GQ',
])

export type Locale = 'en' | 'es'

/** Narrow any locale value to a supported one; anything but Spanish is English. */
export function toLocale(raw: unknown): Locale {
  return raw === 'es' ? 'es' : 'en'
}

export function getLocaleFromCountry(countryCode: string | null | undefined): Locale {
  if (!countryCode) return 'en'
  return SPANISH_COUNTRY_CODES.has(countryCode.toUpperCase()) ? 'es' : 'en'
}
