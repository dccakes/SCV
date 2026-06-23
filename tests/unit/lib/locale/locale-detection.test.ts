import { getLocaleFromCountry, SPANISH_COUNTRY_CODES } from '~/lib/locale/locale-detection'

describe('getLocaleFromCountry', () => {
  describe('Spanish-speaking countries', () => {
    const spanishCountries = [
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
    ]

    it.each(spanishCountries)('returns "es" for %s', (countryCode) => {
      expect(getLocaleFromCountry(countryCode)).toBe('es')
    })

    it('covers all 21 Spanish-speaking country codes in the set', () => {
      expect(SPANISH_COUNTRY_CODES.size).toBe(21)
    })
  })

  describe('non-Spanish countries', () => {
    it.each(['US', 'FR', 'DE', 'GB', 'BR', 'JP'])('returns "en" for %s', (countryCode) => {
      expect(getLocaleFromCountry(countryCode)).toBe('en')
    })
  })

  describe('null, undefined, and empty string', () => {
    it('returns "en" for null', () => {
      expect(getLocaleFromCountry(null)).toBe('en')
    })

    it('returns "en" for undefined', () => {
      expect(getLocaleFromCountry(undefined)).toBe('en')
    })

    it('returns "en" for empty string', () => {
      expect(getLocaleFromCountry('')).toBe('en')
    })
  })

  describe('case-insensitivity', () => {
    it('returns "es" for lowercase "mx"', () => {
      expect(getLocaleFromCountry('mx')).toBe('es')
    })

    it('returns "es" for lowercase "es"', () => {
      expect(getLocaleFromCountry('es')).toBe('es')
    })

    it('returns "es" for mixed-case "Mx"', () => {
      expect(getLocaleFromCountry('Mx')).toBe('es')
    })

    it('returns "en" for lowercase "us"', () => {
      expect(getLocaleFromCountry('us')).toBe('en')
    })
  })
})
