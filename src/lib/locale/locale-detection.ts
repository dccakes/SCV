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

export function getLocaleFromCountry(countryCode: string | null | undefined): Locale {
  if (!countryCode) return 'en'
  return SPANISH_COUNTRY_CODES.has(countryCode.toUpperCase()) ? 'es' : 'en'
}
